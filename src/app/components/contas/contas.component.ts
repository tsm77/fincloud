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

function normalizeBackendTipo(tipo: string): BackendTipoConta | null {
  const t = (tipo ?? '').toUpperCase();

  if (t.includes('CREDITO')) return 'CARTAO_CREDITO';
  if (t.includes('POUP')) return 'CONTA_POUPANCA';
  if (t.includes('CORRENTE')) return 'CONTA_CORRENTE';
  if (t.includes('INVEST')) return 'INVESTIMENTO';
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
  private messageService = inject(MessageService);

  /** =========================
   *  STATE
   *  ========================= */

  readonly modalNovaConta = signal(false);
  readonly query = signal('');
  readonly loadingList = signal(false);
  readonly saving = signal(false);

  readonly contas = signal<Conta[]>([]);
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

  readonly salvarDisabled = computed(() => this.saving() || this.form.invalid);

  /** =========================
   *  FORM
   *  ========================= */

  readonly form = this.fb.group({
    nome: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    tipo: this.fb.control<TipoConta>('Conta Corrente', [Validators.required]),
    saldoInicial: this.fb.control<number>(0),
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
      saldo: Number(dto.saldoInicial ?? dto.saldoInicial ?? 0),
    };
  }

  private toPayload(): ContaCreateDTO {
    const v = this.form.getRawValue();

    return {
      nome: v.nome,
      tipo: UI_TO_BACK[v.tipo],
      saldoInicial: Number(v.saldoInicial ?? 0),
    };
  }

  /** =========================
   *  API
   *  ========================= */

  async carregarContas(): Promise<void> {
    this.loadingList.set(true);

    try {
      const lista = await firstValueFrom(this.contaService.listar());

      this.contas.set(
        (lista ?? []).map((dto: ContaResponseDTO) => this.mapFromApi(dto)),
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

  /** =========================
   *  UI ACTIONS
   *  ========================= */

  abrirModal(): void {
    this.editandoId = null;
    this.form.reset({
      nome: '',
      tipo: 'Conta Corrente',
      saldoInicial: 0,
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
        // ✏️ EDITAR
        await firstValueFrom(
          this.contaService.editar(this.editandoId, payload),
        );

        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Conta atualizada com sucesso!',
        });
      } else {
        // 🆕 CRIAR
        await firstValueFrom(this.contaService.criar(payload));

        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Conta criada com sucesso!',
        });
      }

      this.modalNovaConta.set(false);
      this.editandoId = null; // 🔥 IMPORTANTE
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
    this.editandoId = conta.id; // 🔥 ESSENCIAL

    this.form.reset({
      nome: conta.nome,
      tipo: conta.tipo,
      saldoInicial: conta.saldo,
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
}
