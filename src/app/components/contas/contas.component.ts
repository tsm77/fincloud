/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';

import { ImportsModule } from '../shared/imports';
import {
  BACK_TO_UI,
  BackendTipoConta,
  TipoConta,
  UI_TO_BACK,
} from '../../core/interfaces/tipo-conta.enum';
import {
  Conta,
  ContaCreateDTO,
  ContaResponseDTO,
} from '../../core/interfaces/conta.model';
import { ContaService } from '../../core/services/contas.service';
import { Transacao } from '../../core/interfaces/transacoes.model';
import { TransacoesService } from '../../core/services/transacoes.service';

function normalizeBackendTipo(tipo: string): BackendTipoConta | null {
  const t = (tipo ?? '').toUpperCase();

  if (t.includes('CREDITO')) return 'CARTAO_CREDITO';
  if (t.includes('POUP')) return 'CONTA_POUPANCA';
  if (t.includes('CORRENTE')) return 'CONTA_CORRENTE';
  if (t.includes('INVEST')) return 'INVESTIMENTO';
  if (t.includes('SALARIO')) return 'SALARIO';
  if (t.includes('CARTEIRA')) return 'CARTEIRA';
  if (t.includes('CAIXA')) return 'CAIXA';

  return null;
}

/** =========================
 *  COMPONENT
 *  ========================= */

@Component({
  selector: 'app-contas',
  standalone: true,
  imports: [ImportsModule, DropdownModule],
  templateUrl: './contas.component.html',
  styleUrls: ['./contas.component.scss'],
})
export class ContasComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private contaService = inject(ContaService);
  private transacoesService = inject(TransacoesService);
  private messageService = inject(MessageService);

  /** =========================
   *  STATE
   *  ========================= */

  readonly modalNovaConta = signal(false);
  readonly query = signal('');
  readonly loadingList = signal(false);
  readonly saving = signal(false);

  readonly contas = signal<Conta[]>([]);
  readonly totaisGastosPorConta = signal<Record<number, number>>({});
  readonly totaisInvestidosPorConta = signal<Record<number, number>>({});
  readonly totaisSalariosPorConta = signal<Record<number, number>>({});
  menuItemsSelecionado: any[] = [];
  contaSelecionada: any;
  editandoId: number | null = null;

  /** =========================
   *  DROPDOWN
   *  ========================= */

  readonly tipos = [
    { label: 'Conta Corrente', value: 'Conta Corrente' as TipoConta },
    { label: 'Carteira', value: 'Carteira' as TipoConta },
    { label: 'Caixa', value: 'Caixa' as TipoConta },
    { label: 'Cartão de Crédito', value: 'Cartão de Crédito' as TipoConta },
    { label: 'Investimento', value: 'Investimento' as TipoConta },
    { label: 'Salario', value: 'Salario' as TipoConta },
    { label: 'Conta Poupança', value: 'Conta Poupança' as TipoConta },
  ];

  /** =========================
   *  COMPUTED
   *  ========================= */

  readonly contasFiltradas = computed(() => {
    const q = this.query().trim().toLowerCase();

    const list = this.contas().filter((c) => !c.arquivada);

    if (!q) return list;

    return list.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) || c.tipo.toLowerCase().includes(q),
    );
  });

  readonly contasAtivasTotal = computed(
    () => this.contas().filter((c) => !c.arquivada).length,
  );

  /** =========================
   *  FORM
   *  ========================= */

  readonly form = this.fb.group({
    nome: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    tipo: this.fb.control<TipoConta>('Conta Corrente', [Validators.required]),
  });

  /** =========================
   *  LIFECYCLE
   *  ========================= */

  async ngOnInit(): Promise<void> {
    await this.carregarContas();
  }

  /** =========================
   *  MAPPING (INLINE SIMPLES)
   *  ========================= */

  private mapFromApi(dto: ContaResponseDTO): Conta {
    const tipoNormalizado = normalizeBackendTipo(dto.tipo) ?? 'CONTA_CORRENTE';

    return {
      id: dto.id,
      nome: dto.nome,
      tipo: BACK_TO_UI[tipoNormalizado],
      saldo: Number(dto.saldo ?? 0),
    };
  }

  private toPayload(): ContaCreateDTO {
    const v = this.form.getRawValue();

    return {
      nome: v.nome,
      tipo: UI_TO_BACK[v.tipo],
    };
  }

  /** =========================
   *  API
   *  ========================= */

  async carregarContas(): Promise<void> {
    this.loadingList.set(true);

    try {
      const [lista, transacoes] = await Promise.all([
        firstValueFrom(this.contaService.listar()),
        firstValueFrom(this.transacoesService.listar()),
      ]);

      this.contas.set(
        (lista ?? []).map((dto: ContaResponseDTO) => this.mapFromApi(dto)),
      );
      this.totaisGastosPorConta.set(
        this.calcularGastosPorConta(transacoes ?? []),
      );
      this.totaisInvestidosPorConta.set(
        this.calcularInvestidosPorConta(transacoes ?? []),
      );
      this.totaisSalariosPorConta.set(
        this.calcularSalariosPorConta(transacoes ?? []),
      );
    } catch (e: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: e?.error?.message ?? 'Falha ao carregar contas',
      });
    } finally {
      this.loadingList.set(false);
    }
  }

  private calcularGastosPorConta(transacoes: Transacao[]): Record<number, number> {
    return transacoes.reduce<Record<number, number>>((totais, transacao) => {
      if (transacao.tipo !== 'DESPESA' || transacao.pago) {
        return totais;
      }

      const valor = Number(transacao.valor ?? 0);
      const totalAtual = totais[transacao.contaId] ?? 0;

      return {
        ...totais,
        [transacao.contaId]: totalAtual + valor,
      };
    }, {});
  }

  getTotalGastoConta(contaId: number): number {
    return this.totaisGastosPorConta()[contaId] ?? 0;
  }

  private calcularInvestidosPorConta(transacoes: Transacao[]): Record<number, number> {
    return transacoes.reduce<Record<number, number>>((totais, transacao) => {
      if (transacao.tipo !== 'RECEITA') {
        return totais;
      }

      const valor = Number(transacao.valor ?? 0);
      const totalAtual = totais[transacao.contaId] ?? 0;

      return {
        ...totais,
        [transacao.contaId]: totalAtual + valor,
      };
    }, {});
  }

  getTotalInvestidoConta(contaId: number): number {
    return this.totaisInvestidosPorConta()[contaId] ?? 0;
  }

  private calcularSalariosPorConta(transacoes: Transacao[]): Record<number, number> {
    return transacoes.reduce<Record<number, number>>((totais, transacao) => {
      if (transacao.tipo !== 'SALARIO') {
        return totais;
      }

      const valor = Number(transacao.valor ?? 0);
      const totalAtual = totais[transacao.contaId] ?? 0;

      return {
        ...totais,
        [transacao.contaId]: totalAtual + valor,
      };
    }, {});
  }

  getTotalSalarioConta(contaId: number): number {
    return this.totaisSalariosPorConta()[contaId] ?? 0;
  }

  isContaInvestimento(conta: Conta): boolean {
    const tipo = this.normalizarTipo(conta.tipo);

    return tipo.includes('invest') || tipo.includes('poup');
  }

  isContaSalario(conta: Conta): boolean {
    return this.normalizarTipo(conta.tipo).includes('salario');
  }

  getTotalLabel(conta: Conta): string {
    if (this.isContaSalario(conta)) return 'Total salario';
    if (this.isContaInvestimento(conta)) return 'Total investido';

    return 'Total gasto';
  }

  getTotalConta(conta: Conta): number {
    if (this.isContaSalario(conta)) return this.getTotalSalarioConta(conta.id);
    if (this.isContaInvestimento(conta)) {
      return this.getTotalInvestidoConta(conta.id);
    }

    return this.getTotalGastoConta(conta.id);
  }

  isTotalPositivo(conta: Conta): boolean {
    return this.isContaInvestimento(conta) || this.isContaSalario(conta);
  }

  /** =========================
   *  UI ACTIONS
   *  ========================= */

  abrirModal(): void {
    this.editandoId = null;
    this.form.reset({
      nome: '',
      tipo: 'Conta Corrente',
    });

    this.modalNovaConta.set(true);
  }

  remover(t: Conta) {
    this.contaService.remover(t.id).subscribe(() => this.carregarContas());
  }

  cancelarModal(): void {
    this.modalNovaConta.set(false);
  }

  async salvarConta(): Promise<void> {
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    this.saving.set(true);

    try {
      const payload = this.toPayload();

      if (this.editandoId) {
        await firstValueFrom(
          this.contaService.editar(this.editandoId, payload),
        );

        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Conta atualizada com sucesso!',
        });
      } else {
        await firstValueFrom(this.contaService.criar(payload));

        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Conta criada com sucesso!',
        });
      }

      this.modalNovaConta.set(false);
      this.editandoId = null;
      await this.carregarContas();
    } catch (e: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: e?.error?.message ?? 'Erro ao salvar conta',
      });
    } finally {
      this.saving.set(false);
    }
  }

  editar(conta: Conta) {
    this.editandoId = conta.id;

    this.form.reset({
      nome: conta.nome,
      tipo: conta.tipo,
    });

    this.modalNovaConta.set(true);
  }

  arquivar(conta: Conta): void {
    this.contas.set(
      this.contas().map((c) =>
        c.id === conta.id ? { ...c, arquivada: true } : c,
      ),
    );
  }

  abrirMenu(event: any, conta: any, menu: any) {
    this.contaSelecionada = conta;

    this.menuItemsSelecionado = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.editar(conta),
      },
      {
        label: 'Excluir',
        icon: 'pi pi-trash',
        command: () => this.remover(conta),
      },
    ];

    menu.toggle(event);
  }

  getContaIcon(tipo: TipoConta): string {
    const normalizado = this.normalizarTipo(tipo);

    if (normalizado.includes('credito')) return 'pi pi-credit-card';
    if (normalizado.includes('invest')) return 'pi pi-chart-line';
    if (normalizado.includes('salario')) return 'pi pi-briefcase';
    if (normalizado.includes('carteira')) return 'pi pi-wallet';
    if (normalizado.includes('poup')) return 'pi pi-money-bill';
    if (normalizado.includes('caixa')) return 'pi pi-box';

    return 'pi pi-building-columns';
  }

  private normalizarTipo(tipo: TipoConta): string {
    return tipo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
