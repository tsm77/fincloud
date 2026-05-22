import { Component, OnInit, inject } from '@angular/core';
import { ImportsModule } from '../shared/imports';
import { firstValueFrom } from 'rxjs';
import { TransacoesService } from '../../core/services/transacoes.service';
import { ContaResponseDTO } from '../../core/interfaces/conta.model';
import { Transacao } from '../../core/interfaces/transacoes.model';
import { ContaService } from '../../core/services/contas.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ImportsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private service = inject(TransacoesService);
  private contasService = inject(ContaService);

  // 🔢 RESUMO
  saldoTotal = 0;
  totalReceitas = 0;
  totalDespesas = 0;
  totalInvestido = 0;

  // 📋 LISTA
  ultimasTransacoes: Transacao[] = [];

  //  CONTAS PAGAS E NÃO PAGAS
  contasNaoPagas: Transacao[] = [];
  contasPagas: Transacao[] = [];
  contasNaoPagesTotalValor = 0;
  contasPagasTotalValor = 0;

  // 📅 FILTRO (NOVO)
  dataInicial: Date | null = null;
  dataFinal: Date | null = null;

  loading = false;

  async ngOnInit() {
    this.setMesAtual(); // padrão inicial
    await this.carregarDashboard();
  }

  // 🎯 DEFINE MÊS ATUAL COMO PADRÃO
  private setMesAtual() {
    const hoje = new Date();

    this.dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.dataFinal = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  }

  // 🚀 CARREGA DADOS
  async carregarDashboard() {
    this.loading = true;

    try {
      const [listaTransacoes, listaContas] = await Promise.all([
        firstValueFrom(this.service.listar()),
        firstValueFrom(this.contasService.listar()),
      ]);

      const transacoes: Transacao[] = listaTransacoes ?? [];
      const contas = listaContas ?? [];

      this.processarDados(transacoes, contas);
    } catch (e) {
      console.error('Erro ao carregar dashboard', e);
    } finally {
      this.loading = false;
    }
  }

  // 🔄 QUANDO USUÁRIO FILTRA
  aplicarFiltro() {
    this.carregarDashboard();
  }

  // 🧠 PROCESSAMENTO CENTRAL
  private processarDados(transacoes: Transacao[], contas: ContaResponseDTO[]) {
    const filtradas = this.filtrarPorPeriodo(transacoes);
    const contasGuardadasIds = new Set(
      contas
        .filter((conta) => this.isContaGuardada(conta))
        .map((conta) => conta.id),
    );

    this.calcularResumo(filtradas, contasGuardadasIds);
    this.calcularInvestimentos(transacoes, contasGuardadasIds);
    this.montarUltimas(transacoes); // mantém geral
    this.montarContas(filtradas);
  }

  // 📅 FILTRO POR DATA
  private filtrarPorPeriodo(transacoes: Transacao[]) {
    if (!this.dataInicial || !this.dataFinal) return transacoes;

    const inicio = new Date(this.dataInicial);
    const fim = new Date(this.dataFinal);

    // garante inclusão do dia final completo
    fim.setHours(23, 59, 59, 999);

    return transacoes.filter((t) => {
      const data = new Date(t.data);
      return data >= inicio && data <= fim;
    });
  }

  // 💰 RESUMO
  private calcularResumo(
    transacoes: Transacao[],
    contasGuardadasIds: Set<number>,
  ) {
    const totalReceitasPeriodo = transacoes
      .filter((t) => t.tipo === 'RECEITA')
      .reduce((acc, t) => acc + Number(t.valor), 0);

    this.totalReceitas = transacoes
      .filter((t) => t.tipo === 'RECEITA' && contasGuardadasIds.has(t.contaId))
      .reduce((acc, t) => acc + Number(t.valor), 0);

    this.totalDespesas = transacoes
      .filter((t) => t.tipo === 'DESPESA')
      .reduce((acc, t) => acc + Number(t.valor), 0);

    this.saldoTotal = Math.max(totalReceitasPeriodo - this.totalDespesas, 0);
  }

  // 💰 INVESTIMENTOS
  private calcularInvestimentos(
    transacoes: Transacao[],
    contasGuardadasIds: Set<number>,
  ) {
    const total = transacoes
      .filter((t) => contasGuardadasIds.has(t.contaId))
      .reduce((acc, t) => {
        const valor = Number(t.valor);

        return t.tipo === 'RECEITA' ? acc + valor : acc - valor;
      }, 0);

    this.totalInvestido = Math.max(total, 0);
  }

  // 📋 ÚLTIMAS TRANSAÇÕES
  private montarUltimas(transacoes: Transacao[]) {
    this.ultimasTransacoes = [...transacoes]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5);
  }

  //  CONTAS PAGAS E NÃO PAGAS
  private montarContas(transacoes: Transacao[]) {
    const despesas = transacoes.filter((t) => this.isDespesa(t));

    this.contasNaoPagas = despesas
      .filter((t) => !t.pago)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    this.contasPagas = despesas
      .filter((t) => t.pago)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    this.contasNaoPagesTotalValor = this.contasNaoPagas.reduce(
      (acc, t) => acc + Number(t.valor),
      0,
    );

    this.contasPagasTotalValor = this.contasPagas.reduce(
      (acc, t) => acc + Number(t.valor),
      0,
    );

  }

  private isDespesa(transacao: Transacao): boolean {
    return transacao.tipo === 'DESPESA';
  }

  private isContaGuardada(conta: ContaResponseDTO): boolean {
    const tipo = this.normalizarTexto(conta.tipo);

    return tipo.includes('INVEST') || tipo.includes('POUP');
  }

  private normalizarTexto(valor: unknown): string {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }
}
