/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MessageService } from 'primeng/api';

import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ImportsModule } from '../shared/imports';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImportsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
})
export class UsuariosComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(MessageService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly originalEmail = signal('');

  readonly form = this.fb.group({
    nome: this.fb.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(80),
    ]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    senha: this.fb.control('', [Validators.minLength(4)]),
  });

  readonly salvarDisabled = computed(() => this.saving() || this.form.invalid);

  async ngOnInit(): Promise<void> {
    await this.carregarUsuario();
  }

  async carregarUsuario(): Promise<void> {
    this.loading.set(true);

    try {
      const usuario = await firstValueFrom(this.usuarioService.carregarAtual());

      this.originalEmail.set(usuario.email ?? '');
      this.form.reset({
        nome: usuario.nome ?? '',
        email: usuario.email ?? '',
        senha: '',
      });
    } catch (err: any) {
      this.toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: err?.error?.message ?? 'Nao foi possivel carregar seu usuario.',
      });
    } finally {
      this.loading.set(false);
    }
  }

  async salvar(): Promise<void> {
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const valores = this.form.getRawValue();
    const email = valores.email.trim().toLowerCase();
    const senha = valores.senha.trim();
    const emailAlterado = this.originalEmail().toLowerCase() !== email;

    this.saving.set(true);

    try {
      await firstValueFrom(
        this.usuarioService.atualizarAtual({
          nome: valores.nome.trim(),
          email,
          ...(senha ? { senha } : {}),
        }),
      );

      this.originalEmail.set(email);
      this.form.controls.senha.reset('');

      this.toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Usuario atualizado com sucesso.',
      });

      if (emailAlterado) {
        this.toast.add({
          severity: 'info',
          summary: 'Login',
          detail: 'Entre novamente com o novo email.',
        });

        await this.aguardarMensagem();
        this.auth.logout();
        this.usuarioService.limparAtual();
        await this.router.navigateByUrl('/login');
      }
    } catch (err: any) {
      this.toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: err?.error?.message ?? 'Nao foi possivel salvar seu usuario.',
      });
    } finally {
      this.saving.set(false);
    }
  }

  async voltar(): Promise<void> {
    await this.router.navigateByUrl('/dashboard');
  }

  private aguardarMensagem(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1200));
  }
}
