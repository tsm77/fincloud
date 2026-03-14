/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, computed, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MessageService } from 'primeng/api';

// Service
import { AuthService } from '../../core/services/auth.service';
import { UsuarioComponent } from '../usuario/usuario.component';
import { ImportsModule } from '../shared/imports';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, UsuarioComponent, ImportsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  visible = false;
  readonly loading = signal(false);
  readonly showInlineError = signal(false);

  readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [
      Validators.required,
      Validators.minLength(4),
    ]),
    remember: this.fb.control(false),
  });

  readonly disabled = computed(() => this.loading() || this.form.invalid);

  async onSubmit() {
    console.log('Submit disparado');

    this.showInlineError.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();

    this.loading.set(true);

    try {
      const response = await firstValueFrom(
        this.auth.login({
          email: email,
          senha: password,
        }),
      );

      console.log('Resposta backend:', response);

      // se vier token
      const token = response.token;
      console.log('token', token);

      if (token) {
        sessionStorage.setItem('token', token);
        await this.router.navigateByUrl('');
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Login realizado com sucesso!',
      });

      // aqui você pode redirecionar depois
      // this.router.navigateByUrl('/dashboard');
    } catch (error: any) {
      console.error('Erro login:', error);

      this.showInlineError.set(true);

      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: error?.error?.message ?? 'Usuário ou senha inválidos',
      });
    } finally {
      this.loading.set(false);
    }
  }

  forgotPassword(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Recuperação',
      detail: 'Implementar fluxo de recuperação.',
    });
  }
  showDialog(): void {
    this.visible = true;
  }

  hideDialog(): void {
    this.visible = false;
  }
}
