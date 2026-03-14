/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { DropdownModule } from 'primeng/dropdown';
import { MenuItem, MessageService } from 'primeng/api';

import { ImportsModule } from '../shared/imports';
import { ContaService } from '../../core/services/contas.service';
import { Popover } from 'primeng/popover';

/** =========================
 *  TIPOS
 *  ========================= */

type BackendTipoConta =
  | 'CARTEIRA'
  | 'CAIXA'
  | 'CARTAO_CREDITO'
  | 'CONTA_CORRENTE'
  | 'INVESTIMENTO'
  | 'CONTA_POUPANCA';

type TipoConta =
  | 'Conta Corrente'
  | 'Carteira'
  | 'Caixa'
  | 'Cartão de Crédito'
  | 'Investimento'
  | 'Conta Poupança';

export type Conta = {
  id: string;
  nome: string;
  tipo: TipoConta; // UI label
  saldo: number;
  cor: string; // hex
  arquivada?: boolean;
};

type ContaResponseDTO = {
  id: number | string;
  nome: string;
  tipo: BackendTipoConta | string;
  saldoInicial?: number | null;
  saldo?: number | null;
  cor?: string | null;
  ativa?: boolean | null;
};

type ContaCreateDTO = {
  nome: string;
  tipo: BackendTipoConta;
  saldoInicial: number;
  cor: string;
};

const BACK_TO_UI: Record<BackendTipoConta, TipoConta> = {
  CONTA_CORRENTE: 'Conta Corrente',
  CARTEIRA: 'Carteira',
  CAIXA: 'Caixa',
  CARTAO_CREDITO: 'Cartão de Crédito',
  INVESTIMENTO: 'Investimento',
  CONTA_POUPANCA: 'Conta Poupança',
};

const UI_TO_BACK: Record<TipoConta, BackendTipoConta> = {
  'Conta Corrente': 'CONTA_CORRENTE',
  Carteira: 'CARTEIRA',
  Caixa: 'CAIXA',
  'Cartão de Crédito': 'CARTAO_CREDITO',
  Investimento: 'INVESTIMENTO',
  'Conta Poupança': 'CONTA_POUPANCA',
};

function normalizeBackendTipo(tipo: string): BackendTipoConta | null {
  const t = (tipo ?? '').trim().toUpperCase();

  // variações comuns
  if (t === 'CARTAO' || t === 'CARTÃO') return 'CARTAO_CREDITO';
  if (t.includes('CREDITO') || t.includes('CRÉDITO')) return 'CARTAO_CREDITO';
  if (t.includes('POUP')) return 'CONTA_POUPANCA';
  if (t.includes('CORRENTE')) return 'CONTA_CORRENTE';
  if (t.includes('INVEST')) return 'INVESTIMENTO';
  if (t.includes('CARTEIRA')) return 'CARTEIRA';
  if (t.includes('CAIXA')) return 'CAIXA';

  if (t in BACK_TO_UI) return t as BackendTipoConta;
  return null;
}

@Component({
  selector: 'app-contas',
  standalone: true,
  imports: [ImportsModule, CurrencyPipe, DropdownModule],
  templateUrl: './contas.component.html',
  styleUrls: ['./contas.component.scss'],
})
export class ContasComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private contaService = inject(ContaService);
  private messageService = inject(MessageService);

  @ViewChild('op') op!: Popover;

  selectedMember = null;
  members = [
    {
      name: 'Amy Elsner',
      image: 'amyelsner.png',
      email: 'amy@email.com',
      role: 'Owner',
    },
    {
      name: 'Bernardo Dominic',
      image: 'bernardodominic.png',
      email: 'bernardo@email.com',
      role: 'Editor',
    },
    {
      name: 'Ioni Bowcher',
      image: 'ionibowcher.png',
      email: 'ioni@email.com',
      role: 'Viewer',
    },
  ];

  // UI
  readonly modalNovaConta = signal(false);
  readonly query = signal('');
  readonly loadingList = signal(false);
  readonly saving = signal(false);

  // “Tipo de conta” do dropdown (UI labels)
  readonly tipos = [
    { label: 'Conta Corrente', value: 'Conta Corrente' as const },
    { label: 'Carteira', value: 'Carteira' as const },
    { label: 'Caixa', value: 'Caixa' as const },
    { label: 'Cartão de Crédito', value: 'Cartão de Crédito' as const },
    { label: 'Investimento', value: 'Investimento' as const },
    { label: 'Conta Poupança', value: 'Conta Poupança' as const },
  ];

  // Paleta (bolinhas do modal)
  readonly cores = [
    '#1D4ED8',
    '#22C55E',
    '#06B6D4',
    '#F59E0B',
    '#A855F7',
    '#EF4444',
    '#94A3B8',
  ];

  // Dados (vem do backend)
  readonly contas = signal<Conta[]>([]);

  readonly contasFiltradas = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.contas().filter((c) => !c.arquivada);

    if (!q) return list;

    return list.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) || c.tipo.toLowerCase().includes(q),
    );
  });

  // Form do modal (UI)
  readonly form = this.fb.group({
    nome: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    tipo: this.fb.control<TipoConta>('Conta Corrente', [Validators.required]),
    saldoInicial: this.fb.control<number>(0),
    cor: this.fb.control<string>(this.cores[0], [Validators.required]),
  });

  readonly salvarDisabled = computed(() => this.saving() || this.form.invalid);

  item = input.required<{ id: string; nome: string }>();

  // Itens do menu como signal (Angular 18)
  menuItems = signal<MenuItem[]>([
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
    },
    {
      label: 'Remover',
      icon: 'pi pi-trash',
    },
  ]);
  async ngOnInit(): Promise<void> {
    await this.carregarContas();
  }

  /** =========================
   *  MAPEAMENTOS
   *  ========================= */

  private fromApi(dto: ContaResponseDTO): Conta {
    const backendTipo = normalizeBackendTipo(dto.tipo) ?? 'CONTA_CORRENTE';
    const tipoUI = BACK_TO_UI[backendTipo];

    const saldo = Number(dto.saldo ?? dto.saldoInicial ?? 0);

    return {
      id: String(dto.id ?? crypto.randomUUID()),
      nome: dto.nome ?? '',
      tipo: tipoUI,
      saldo,
      cor: dto.cor ?? this.cores[0],
      arquivada: dto.ativa === false, // se ativa=false -> arquivada
    };
  }

  private toCreatePayload(): ContaCreateDTO {
    const v = this.form.getRawValue();

    return {
      nome: v.nome,
      tipo: UI_TO_BACK[v.tipo],
      saldoInicial: Number(v.saldoInicial ?? 0),
      cor: v.cor,
    };
  }

  /** =========================
   *  API
   *  ========================= */

  async carregarContas(): Promise<void> {
    this.loadingList.set(true);

    try {
      const lista = await firstValueFrom(this.contaService.listar()); // Observable<ContaResponseDTO[]>
      const mapped = (lista ?? []).map((dto: ContaResponseDTO) =>
        this.fromApi(dto),
      );
      this.contas.set(mapped);
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

  /** =========================
   *  UI ACTIONS
   *  ========================= */

  abrirModal(): void {
    this.form.reset({
      nome: '',
      tipo: 'Conta Corrente',
      saldoInicial: 0,
      cor: this.cores[0],
    });
    this.modalNovaConta.set(true);
  }

  cancelarModal(): void {
    this.modalNovaConta.set(false);
  }

  async salvarConta(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);

    try {
      const payload = this.toCreatePayload();

      await firstValueFrom(this.contaService.criar(payload));

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Conta criada com sucesso!',
      });

      this.modalNovaConta.set(false);
      await this.carregarContas();
    } catch (e: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: e?.error?.message ?? 'Falha ao criar conta',
      });
    } finally {
      this.saving.set(false);
    }
  }

  arquivar(conta: Conta): void {
    // por enquanto só no front
    this.contas.set(
      this.contas().map((c) =>
        c.id === conta.id ? { ...c, arquivada: true } : c,
      ),
    );
  }

  editar(conta: Conta): void {
    // por enquanto: abre modal preenchido (sem PUT ainda)
    this.form.reset({
      nome: conta.nome,
      tipo: conta.tipo,
      saldoInicial: conta.saldo,
      cor: conta.cor,
    });
    this.modalNovaConta.set(true);
  }

  setCor(cor: string): void {
    this.form.controls.cor.setValue(cor);
  }

  toggle(event: any) {
    this.op.toggle(event);
  }

  selectMember(member: any) {
    this.selectedMember = member;
    this.op.hide();
  }
}
