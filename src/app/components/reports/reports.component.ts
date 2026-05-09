/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, inject } from '@angular/core';
import { ImportsModule } from '../shared/imports';
import { firstValueFrom } from 'rxjs';
import { TransacoesService } from '../../core/services/transacoes.service';

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: 'RECEITA' | 'DESPESA';
  data: string | Date;
  categoriaNome: string;
}

interface ResumoCategoria {
  nome: string;
  tipo: 'RECEITA' | 'DESPESA';
  valor: number;
  percentual: string;
  cor: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [ImportsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  private service = inject(TransacoesService);

  // 📊 GRÁFICO
  graficoCategorias: any;
  resumoCategorias: ResumoCategoria[] = [];
  totalReceitas = 0;
  totalDespesas = 0;
  saldoPeriodo = 0;
  totalMovimentado = 0;

  // 📅 FILTRO
  dataInicial: Date | null = null;
  dataFinal: Date | null = null;

  chartOptions = {
    cutout: '68%',
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  loading = false;

  get maiorCategoria(): string {
    return this.resumoCategorias[0]?.nome ?? '-';
  }

  async ngOnInit() {
    this.setMesAtual();
    await this.carregarRelatorios();
  }

  // 🎯 DEFINE MÊS ATUAL COMO PADRÃO
  private setMesAtual() {
    const hoje = new Date();

    this.dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.dataFinal = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  }

  // 🚀 CARREGA DADOS
  async carregarRelatorios() {
    this.loading = true;

    try {
      const lista = await firstValueFrom(this.service.listar());
      const transacoes: Transacao[] = lista ?? [];

      this.processarDados(transacoes);
    } catch (e) {
      console.error('Erro ao carregar relatórios', e);
    } finally {
      this.loading = false;
    }
  }

  // 🔄 QUANDO USUÁRIO FILTRA
  aplicarFiltro() {
    this.carregarRelatorios();
  }

  // 🧠 PROCESSAMENTO CENTRAL
  private processarDados(transacoes: Transacao[]) {
    const filtradas = this.filtrarPorPeriodo(transacoes);

    this.montarGrafico(filtradas);
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

  // 📊 GRÁFICO + RESUMO
  private montarGrafico(transacoes: Transacao[]) {
    const mapa = new Map<
      string,
      { nome: string; tipo: 'RECEITA' | 'DESPESA'; valor: number }
    >();

    transacoes.forEach((t) => {
      const chave = `${t.tipo}-${t.categoriaNome}`;
      const atual = mapa.get(chave) ?? {
        nome: t.categoriaNome,
        tipo: t.tipo,
        valor: 0,
      };

      atual.valor += Number(t.valor);
      mapa.set(chave, atual);
    });

    this.totalReceitas = transacoes
      .filter((t) => t.tipo === 'RECEITA')
      .reduce((acc, t) => acc + Number(t.valor), 0);

    this.totalDespesas = transacoes
      .filter((t) => t.tipo === 'DESPESA')
      .reduce((acc, t) => acc + Number(t.valor), 0);

    this.saldoPeriodo = this.totalReceitas - this.totalDespesas;
    this.totalMovimentado = this.totalReceitas + this.totalDespesas;

    const coresReceita = ['#16a34a', '#22c55e', '#059669', '#14b8a6'];
    const coresDespesa = ['#dc2626', '#f97316', '#f59e0b', '#8b5cf6'];
    let receitaIndex = 0;
    let despesaIndex = 0;

    this.resumoCategorias = Array.from(mapa.values())
      .map((categoria) => {
        const cores =
          categoria.tipo === 'RECEITA' ? coresReceita : coresDespesa;
        const indice =
          categoria.tipo === 'RECEITA' ? receitaIndex++ : despesaIndex++;

        return {
          ...categoria,
          percentual:
            this.totalMovimentado > 0
              ? ((categoria.valor / this.totalMovimentado) * 100).toFixed(0)
              : '0',
          cor: cores[indice % cores.length],
        };
      })
      .sort((a, b) => b.valor - a.valor);

    this.graficoCategorias = {
      labels: this.resumoCategorias.map(
        (categoria) => `${categoria.nome} (${this.tipoLabel(categoria.tipo)})`,
      ),
      datasets: [
        {
          data: this.resumoCategorias.map((categoria) => categoria.valor),
          backgroundColor: this.resumoCategorias.map((c) => c.cor),
          borderWidth: 0,
        },
      ],
    };
  }

  tipoLabel(tipo: 'RECEITA' | 'DESPESA'): string {
    return tipo === 'RECEITA' ? 'Receita' : 'Despesa';
  }
}
