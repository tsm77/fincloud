import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { MessageService, ConfirmationService } from 'primeng/api';
import { CategoriaService } from '../../core/services/categorias.service';
import {
  Categoria,
  CategoriaTipo,
} from '../../core/interfaces/categorias.model';
import { ImportsModule } from '../shared/imports';

@Component({
  selector: 'app-categorias-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImportsModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriasComponent {
  private readonly service = inject(CategoriaService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  readonly loading = signal(false);
  readonly categorias = signal<Categoria[]>([]);

  readonly dialogAberto = signal(false);
  readonly modoEdicao = signal(false);
  readonly categoriaEditandoId = signal<number | null>(null);

  readonly filtro = signal('');

  readonly cores: string[] = [
    '#3b82f6', // azul
    '#22c55e', // verde
    '#a855f7', // roxo
    '#ef4444', // vermelho
    '#f59e0b', // laranja
    '#ec4899', // rosa,
  ] as const;

  readonly form = this.fb.nonNullable.group({
    nome: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(40)],
    ],
    tipo: ['RECEITA' as CategoriaTipo, [Validators.required]],
    cor: [this.cores[0], [Validators.required]],
  });

  readonly categoriasFiltradas = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    const list = this.categorias();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) || c.tipo.toLowerCase().includes(q),
    );
  });

  constructor() {
    // carrega ao entrar
    effect(() => {
      this.carregar();
    });
  }

  carregar() {
    this.loading.set(true);
    this.service
      .listar()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.categorias.set(data ?? []),
        error: () => this.toastErro('Não foi possível carregar categorias.'),
      });
  }

  abrirNova() {
    this.modoEdicao.set(false);
    this.categoriaEditandoId.set(null);
    this.form.reset({
      nome: '',
      tipo: 'RECEITA',
      cor: this.cores[0],
    });
    this.dialogAberto.set(true);
  }

  abrirEdicao(cat: Categoria) {
    this.modoEdicao.set(true);
    this.categoriaEditandoId.set(cat.id);
    this.form.reset({
      nome: cat.nome,
      tipo: cat.tipo,
      cor: cat.cor,
    });
    this.dialogAberto.set(true);
  }

  fecharDialog() {
    this.dialogAberto.set(false);
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = this.form.getRawValue();
    this.loading.set(true);

    console.log(dto);

    const id = this.categoriaEditandoId();
    const req$ = id ? this.service.editar(id, dto) : this.service.criar(dto);

    req$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastSucesso(id ? 'Categoria atualizada!' : 'Categoria criada!');
        this.fecharDialog();
        this.carregar();
      },
      error: () => this.toastErro('Falha ao salvar categoria.'),
    });
  }

  confirmarRemocao(cat: Categoria) {
    this.confirm.confirm({
      header: 'Remover categoria',
      message: `Tem certeza que deseja remover "${cat.nome}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      accept: () => this.remover(cat.id),
    });
  }

  private remover(id: number) {
    this.loading.set(true);
    this.service
      .remover(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.toastSucesso('Categoria removida!');
          this.carregar();
        },
        error: () => this.toastErro('Falha ao remover categoria.'),
      });
  }

  tipoSeverity(tipo: CategoriaTipo): 'success' | 'danger' {
    return tipo === 'RECEITA' ? 'success' : 'danger';
  }

  tipoLabel(tipo: CategoriaTipo) {
    return tipo === 'DESPESA' ? 'Despesa' : 'Receita';
  }

  selecionarCor(cor: string) {
    this.form.controls.cor.setValue(cor);
    this.form.controls.cor.markAsDirty();
  }

  trackById(_: number, item: Categoria) {
    return item.id;
  }

  private toastSucesso(detail: string) {
    this.msg.add({ severity: 'success', summary: 'Sucesso!', detail });
  }

  private toastErro(detail: string) {
    this.msg.add({ severity: 'error', summary: 'Erro', detail });
  }
}
