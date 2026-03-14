import {
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FloatLabelModule } from 'primeng/floatlabel';

import { UsuarioService } from '../../core/services/usuario.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    InputGroupModule,
    InputGroupAddonModule,
    FloatLabelModule,
    CommonModule,
  ],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.scss'],
})
export class UsuarioComponent {
  @Output() close = new EventEmitter<void>();
  private fb = inject(NonNullableFormBuilder);
  private usuarioService = inject(UsuarioService);
  private toast = inject(MessageService);

  readonly loading = signal(false);

  readonly formUsuario = this.fb.group({
    nome: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    senha: this.fb.control('', [Validators.required, Validators.minLength(3)]),
  });

  readonly disabled = computed(
    () => this.loading() || this.formUsuario.invalid,
  );

  onCancel(): void {
    this.close.emit();
  }

  async onSave(): Promise<void> {
    if (this.formUsuario.invalid) {
      this.formUsuario.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      const payload = this.formUsuario.getRawValue();

      await firstValueFrom(this.usuarioService.create(payload));

      this.toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Usuário cadastrado!',
      });

      this.formUsuario.reset({ nome: '', email: '', senha: '' });
      this.close.emit(); // ✅ fecha o modal
    } catch (err: any) {
      this.toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: err?.error?.message ?? 'Não foi possível cadastrar.',
      });
    } finally {
      this.loading.set(false);
    }
  }
}
