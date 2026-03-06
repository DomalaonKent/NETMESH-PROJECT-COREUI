import { Component, HostBinding, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  FormFeedbackComponent,
  InputGroupComponent,
  InputGroupTextDirective,
  RowComponent,
  FormLabelDirective,
  AlertComponent,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-login1',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardComponent,
    CardBodyComponent,
    InputGroupComponent,
    InputGroupTextDirective,
    FormControlDirective,
    FormFeedbackComponent,
    FormLabelDirective,
    ButtonDirective,
    AlertComponent,
    IconDirective,
  ],
  templateUrl: './login1.component.html',
  styleUrls: ['./login1.component.scss']
})
export class Login1Component implements OnDestroy {

  @HostBinding('style.display') display = 'block';
  @HostBinding('style.min-height') minHeight = '100vh';

  loginForm: FormGroup;
  errorMessage = '';

  private prevBodyClass: string = '';
  private prevBodyStyle: string = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      idNumber: ['', Validators.required],
      password: ['', Validators.required],
    });

    this.prevBodyClass = document.body.className;
    this.prevBodyStyle = document.body.getAttribute('style') || '';

    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.setAttribute(
      'style',
      'background: linear-gradient(135deg, #e8edf5 0%, #f5f7fa 100%) !important; color-scheme: light !important; color: #1e293b !important;'
    );
  }

  ngOnDestroy(): void {
    document.body.className = this.prevBodyClass;
    if (this.prevBodyStyle) {
      document.body.setAttribute('style', this.prevBodyStyle);
    } else {
      document.body.removeAttribute('style');
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onLogin(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;
    this.errorMessage = '';
    this.router.navigate(['/dashboard']);
  }
}