/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormArray,
  FormGroup,
} from '@angular/forms';

import { finalize } from 'rxjs';

import { TransacoesService } from '../../core/services/transacoes.service';
import { CategoriaService } from '../../core/services/categorias.service';

import { Transacao } from '../../core/interfaces/transacoes.model';

import { Categoria } from '../../core/interfaces/categorias.model';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ImportsModule } from '../shared/imports';
import { ContaService } from '../../core/services/contas.service';
import { ContaResponseDTO } from '../../core/interfaces/conta.model';

@Component({
  selector: 'app-transacoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImportsModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './transacoes.component.html',
  styleUrls: ['./transacoes.component.scss'],
})
export class TransacoesComponent {
  private readonly service = inject(TransacoesService);
  private readonly contasService = inject(ContaService);
  private readonly categoriasService = inject(CategoriaService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  // =========================
  // STATE
  // =========================
  readonly transacoes = signal<Transacao[]>([]);
  readonly contas = signal<ContaResponseDTO[]>([]);
  readonly categorias = signal<Categoria[]>([]);

  transacoesList: Transacao[] = [];
  transacoesFiltradas: Transacao[] = [];

  readonly loading = signal(false);
  readonly dialogAberto = signal(false);

  editandoId: number | null = null;

  dataAtual: Date = new Date();

  transacoesAgrupadas: any[] = [];
  expandedCategorias: { [key: string]: boolean } = {};

  // =========================
  // FORM
  // =========================
  form = this.fb.group({
    contaId: [null as number | null, Validators.required],
    categoriaId: [null as number | null, Validators.required],
    data: [null as Date | null, Validators.required],
    items: this.fb.array<FormGroup>([]),
  });

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  // =========================
  // INIT
  // =========================
  constructor() {
    this.carregarDadosAuxiliares();
    this.carregar();
    this.adicionarItem();
  }

  // =========================
  // 🔥 CORREÇÃO TIMEZONE
  // =========================
  private parseDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // =========================
  // MÊS / ANO
  // =========================
  get mesAtual(): number {
    return this.dataAtual.getMonth();
  }

  get anoAtual(): number {
    return this.dataAtual.getFullYear();
  }

  get mesNomeAtual(): string {
    return this.getMesNome(this.mesAtual);
  }

  proximoMes() {
    const nova = new Date(this.dataAtual);
    nova.setMonth(nova.getMonth() + 1);
    this.dataAtual = nova;
    this.aplicarFiltroMes();
  }

  mesAnterior() {
    const nova = new Date(this.dataAtual);
    nova.setMonth(nova.getMonth() - 1);
    this.dataAtual = nova;
    this.aplicarFiltroMes();
  }

  aplicarFiltroMes() {
    const mes = this.dataAtual.getMonth();
    const ano = this.dataAtual.getFullYear();

    this.transacoesFiltradas = this.transacoesList.filter((t) => {
      const d = new Date(t.data);

      return d.getMonth() === mes && d.getFullYear() === ano;
    });

    this.agruparPorCategoria();
  }

  getMesNome(mes: number): string {
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return meses[mes];
  }

  // =========================
  // CARREGAR
  // =========================
  carregar() {
    this.loading.set(true);

    this.service
      .listar()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          // 🔥 CORREÇÃO DEFINITIVA DO BUG
          this.transacoesList = res.map((t) => ({
            ...t,
            data: this.parseDate(t.data as any),
          }));

          this.transacoes.set(this.transacoesList);

          this.aplicarFiltroMes();
        },
        error: () => this.toastErro('Erro ao carregar transações'),
      });
  }

  carregarDadosAuxiliares() {
    this.contasService.listar().subscribe((res) => this.contas.set(res));
    this.categoriasService
      .listar()
      .subscribe((res) => this.categorias.set(res));
  }

  // =========================
  // AGRUPAMENTO
  // =========================
  agruparPorCategoria() {
    const mapa = new Map<string, any>();

    this.transacoesFiltradas.forEach((t) => {
      if (!mapa.has(t.categoriaNome)) {
        mapa.set(t.categoriaNome, {
          categoria: t.categoriaNome,
          cor: this.getCorCategoria(t.categoriaNome),
          itens: [],
          total: 0,
        });
      }

      const grupo = mapa.get(t.categoriaNome);

      grupo.itens.push({
        ...t,
        pago: (t as any).pago ?? false,
      });

      grupo.total += t.valor;
    });

    this.transacoesAgrupadas = Array.from(mapa.values());
  }

  togglePago(item: any) {
    item.pago = !item.pago;
  }

  toggleCategoria(nome: string) {
    this.expandedCategorias[nome] = !this.expandedCategorias[nome];
  }

  // =========================
  // SALVAR
  // =========================
  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const tipo = this.getTipoCategoria();

    if (!tipo) {
      this.toastErro('Categoria inválida');
      return;
    }

    // 🔥 calcula total (resolve erro "valor é obrigatório")
    const total = this.items.controls
      .map((c) => Number(c.value.valor))
      .reduce((a, b) => a + b, 0);

    const dto: any = {
      contaId: v.contaId!,
      categoriaId: v.categoriaId!,
      tipo,
      data: this.formatarData(v.data!),
      valor: total, // 🔥 ESSENCIAL
      itens: this.items.controls.map((control) => {
        const i = control.getRawValue();

        return {
          descricao: i.descricao,
          valor: Number(i.valor),
          numeroParcela: i.parcelado ? 1 : undefined,
          totalParcelas: i.parcelado ? i.numeroParcelas : 1,
        };
      }),
    };

    this.loading.set(true);

    // 🔥 decide entre criar ou editar
    const request = this.editandoId
      ? this.service.editar(this.editandoId, dto)
      : this.service.criar(dto);

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastSucesso(
          this.editandoId ? 'Transação atualizada!' : 'Transação criada!',
        );

        this.fecharDialog();

        this.editandoId = null; // 🔥 MUITO IMPORTANTE
        this.carregar();
      },
      error: () => {
        this.toastErro('Erro ao salvar');
      },
    });
  }
  remover(t: Transacao) {
    this.service.remover(t.id).subscribe(() => this.carregar());
  }

  // =========================
  // FORM
  // =========================
  criarItem(): FormGroup {
    return this.fb.group({
      descricao: ['', Validators.required],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      parcelado: [false],
      numeroParcelas: [1],
    });
  }

  adicionarItem() {
    this.items.push(this.criarItem());
  }

  removerItem(index: number) {
    this.items.removeAt(index);
  }

  abrirNova() {
    this.editandoId = null;
    this.form.reset();
    this.form.setControl('items', this.fb.array<FormGroup>([this.criarItem()]));
    this.dialogAberto.set(true);
  }

  fecharDialog() {
    this.dialogAberto.set(false);
  }

  editar(item: any) {
    this.editandoId = item.id;

    this.form.patchValue({
      contaId: item.contaId,
      categoriaId: item.categoriaId,
      data: item.data ? new Date(item.data) : null,
    });

    this.items.clear();

    this.items.push(
      this.fb.group({
        descricao: (item.descricao || '').replace(/\(\d+\/\d+\)/, '').trim(), // 🔥 FIX
        valor: item.valor,
        parcelado: item.totalParcelas > 1,
        numeroParcelas: item.totalParcelas || 1,
      }),
    );

    this.dialogAberto.set(true);
  }

  // =========================
  // HELPERS
  // =========================
  formatarData(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getTipoCategoria(): 'RECEITA' | 'DESPESA' | null {
    const categoriaId = this.form.getRawValue().categoriaId;
    const categoria = this.categorias().find((c) => c.id === categoriaId);
    return categoria?.tipo ?? null;
  }

  getCorCategoria(nome: string): string {
    const cat = this.categorias().find((c) => c.nome === nome);
    return cat?.cor || '#999';
  }

  private toastSucesso(detail: string) {
    this.msg.add({ severity: 'success', summary: 'Sucesso', detail });
  }

  private toastErro(detail: string) {
    this.msg.add({ severity: 'error', summary: 'Erro', detail });
  }

  confirmarPagamento(event: any, item: any) {
    const valorAnterior = item.pago;
    const novoValor = event.checked;

    // volta estado imediato
    item.pago = valorAnterior;
    this.cdr.detectChanges();

    this.confirmationService.confirm({
      message: novoValor
        ? `Deseja marcar "${item.descricao}" como paga?`
        : `Deseja remover o pagamento de "${item.descricao}"?`,
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',

      acceptLabel: 'Sim',
      rejectLabel: 'Cancelar',

      accept: () => {
        item.pago = novoValor;

        this.service.atualizarPago(item.id, novoValor).subscribe({
          next: () => {
            // ✅ MENSAGEM DE SUCESSO
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: novoValor
                ? 'Pagamento realizado com sucesso!'
                : 'Pagamento removido com sucesso!',
            });
          },
          error: () => {
            item.pago = valorAnterior;
            this.cdr.detectChanges();

            // ❌ MENSAGEM DE ERRO
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Falha ao atualizar pagamento',
            });
          },
        });
      },

      reject: () => {
        item.pago = valorAnterior;
        this.cdr.detectChanges();
      },
    });
  }
}
