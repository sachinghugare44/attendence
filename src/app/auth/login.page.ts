import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  isLogin = true;
  loginForm: FormGroup;
  registerForm: FormGroup;
  loginError: string = '';
  registerError: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: Router,
    private toastController: ToastController
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.loginError = '';
    this.registerError = '';
    this.successMessage = '';
  }

  onLogin() {
    this.loginError = '';
    this.successMessage = '';
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const requestBody = {
      mobile: this.loginForm.value.username,
      password: this.loginForm.value.password
    };

    this.apiService.validateUser(requestBody).subscribe({
      next: response => {
        const responseData: any = response;
        this.presentToast('Login successful!', 'success');
        localStorage.setItem('mobile', requestBody.mobile);
        localStorage.setItem('name', requestBody.password);
        localStorage.setItem('userId', responseData?.data.name);
        localStorage.setItem('usertype', responseData.data.usertype);
        if(responseData?.data.usertype === '2'){
        this.route.navigate(['/admin-dashboard']);
      }
      else{
        this.route.navigate(['/member-dashboard']);
      }

      },
      error: error => {
        this.loginError = error?.error?.message || 'Invalid credentials. Please try again.';
        this.presentToast(this.loginError, 'danger');
        this.loginForm.reset();
      },
    });
  }

  onRegister() {
    this.registerError = '';
    this.successMessage = '';
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const requestBody = {
      email: this.registerForm.value.email,
      name: this.registerForm.value.name,
      password: this.registerForm.value.password,
      mobile: this.registerForm.value.mobile,
      usertype:1
    };

    this.apiService.createUser(requestBody).subscribe({
      next: () => {
        this.successMessage = 'Registration successful! You can now login.';
        this.presentToast('Registration successful! You can now login.', 'success');
        this.registerForm.reset();
        setTimeout(() => {
          this.successMessage = '';
          this.toggleMode();
        }, 1200);
      },
      error: error => {
        if (error?.error?.message && error.error.message.toLowerCase().includes('already')) {
          this.registerError = 'User already exists with these details.';
        } else {
          this.registerError = 'Registration failed. Please try again.';
        }
        this.presentToast(this.registerError, 'danger');
        this.registerForm.reset();
      },
    });
  }
  onClickHome() {
    this.route.navigate(['/home']);
  }

  onclickresult(){
    this.route.navigate([('/results')])
  }

  callPhoneNumber(phoneNumber:number) {
    window.location.href = `tel:${phoneNumber}`;
  }

  private async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
      color,
      cssClass: 'auth-toast',
      buttons: [{ text: 'Close', role: 'cancel' }]
    });

    await toast.present();
  }
}
