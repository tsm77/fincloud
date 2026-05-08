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
  totalDespesas = 0;

  // 📅 FILTRO
  dataInicial: Date | null = null;
  dataFinal: Date | null = null;

  chartOptions = {
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  loading = false;

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
    const mapa: Record<string, number> = {};
    let total = 0;

    transacoes.forEach((t) => {
      if (t.tipo === 'DESPESA') {
        mapa[t.categoriaNome] = (mapa[t.categoriaNome] || 0) + Number(t.valor);

        total += Number(t.valor);
      }
    });

    const cores = [
      '#22c55e',
      '#ef4444',
      '#3b82f6',
      '#f59e0b',
      '#8b5cf6',
      '#06b6d4',
    ];

    const categorias = Object.keys(mapa);

    this.resumoCategorias = categorias.map((nome, i) => {
      const valor = mapa[nome];

      return {
        nome,
        valor,
        percentual: total > 0 ? ((valor / total) * 100).toFixed(0) : '0',
        cor: cores[i % cores.length],
      };
    });

    this.graficoCategorias = {
      labels: categorias,
      datasets: [
        {
          data: Object.values(mapa),
          backgroundColor: this.resumoCategorias.map((c) => c.cor),
          borderWidth: 0,
        },
      ],
    };
  }
}
