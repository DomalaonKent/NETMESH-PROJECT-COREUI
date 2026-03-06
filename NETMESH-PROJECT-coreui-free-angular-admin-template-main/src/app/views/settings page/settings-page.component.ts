import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SettingsPageService, AppSettings } from './settings-page.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss']
})
export class SettingsPageComponent implements OnInit {

  isLightMode = false;
  saved = false;

  display: AppSettings['display'] = [];
  alerts: AppSettings['alerts'] = [];
  privacy: AppSettings['privacy'] = [];
  exportSettings: AppSettings['exportSettings'] = [];

  constructor(private router: Router, private settingsService: SettingsPageService) {}

  ngOnInit(): void {
    // READ from service (which already loaded from localStorage)
    const s = this.settingsService.current;
    this.isLightMode    = s.isLightMode;
    this.display        = JSON.parse(JSON.stringify(s.display));
    this.alerts         = JSON.parse(JSON.stringify(s.alerts));
    this.privacy        = JSON.parse(JSON.stringify(s.privacy));
    this.exportSettings = JSON.parse(JSON.stringify(s.exportSettings));
    this.settingsService.applyTheme(this.isLightMode);
  }

  onThemeChange(): void {
    this.settingsService.applyTheme(this.isLightMode);
  }

  setDark(): void {
    this.isLightMode = false;
    this.settingsService.applyTheme(false);
  }

  setLight(): void {
    this.isLightMode = true;
    this.settingsService.applyTheme(true);
  }

  saveSettings(): void {
    this.settingsService.save({
      isLightMode: this.isLightMode,
      display: this.display,
      alerts: this.alerts,
      privacy: this.privacy,
      exportSettings: this.exportSettings,
    });
    this.saved = true;
    setTimeout(() => this.saved = false, 2500);
  }

  resetDefaults(): void {
    const fresh = this.settingsService.reset();
    this.isLightMode    = fresh.isLightMode;
    this.display        = JSON.parse(JSON.stringify(fresh.display));
    this.alerts         = JSON.parse(JSON.stringify(fresh.alerts));
    this.privacy        = JSON.parse(JSON.stringify(fresh.privacy));
    this.exportSettings = JSON.parse(JSON.stringify(fresh.exportSettings));
    this.settingsService.applyTheme(fresh.isLightMode);
  }

  goBack(): void {
    this.router.navigate(['/validation-page']);
  }
}