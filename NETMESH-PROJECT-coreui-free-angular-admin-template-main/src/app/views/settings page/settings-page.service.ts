import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SettingItem {
  label: string;
  description: string;
  enabled: boolean;
}

export interface AppSettings {
  isLightMode: boolean;
  display: SettingItem[];
  alerts: SettingItem[];
  privacy: SettingItem[];
  exportSettings: SettingItem[];
}

const STORAGE_KEY = 'app-settings';

const DEFAULTS: AppSettings = {
  isLightMode: false,
  display: [
    { label: 'Compact Table View',         description: 'Show more rows by reducing row height',                 enabled: false },
    { label: 'Show Upload Data Size',       description: 'Display upload data size column in the table',         enabled: true  },
    { label: 'Show Download Data Size',     description: 'Display download data size column in the table',       enabled: true  },
    { label: 'Highlight Service Providers', description: 'Color-code Smart, Globe, and DITO providers',          enabled: true  },
    { label: 'Auto-refresh Data',           description: 'Automatically reload validation data every 5 minutes', enabled: false },
  ],
  alerts: [
    { label: 'Low Signal Strength Alert',  description: 'Notify when signal drops below -90 dBm',               enabled: true  },
    { label: 'Slow Upload Speed Alert',    description: 'Alert when upload speed falls below 1 Mbps',            enabled: true  },
    { label: 'Slow Download Speed Alert',  description: 'Alert when download speed falls below 5 Mbps',          enabled: false },
    { label: 'Provider Outage Alert',      description: 'Notify when a service provider has no active records',  enabled: true  },
    { label: 'New Validation Record',      description: 'Alert when new connectivity records are added',         enabled: false },
  ],
  privacy: [
    { label: 'Remember Filters',  description: 'Save your last-used region/province filters',             enabled: true  },
    { label: 'Activity Logging',  description: 'Log user actions for audit purposes',                     enabled: true  },
    { label: 'Share Analytics',   description: 'Allow anonymous usage data to improve the system',        enabled: false },
  ],
  exportSettings: [
    { label: 'Include Signal Strength', description: 'Add signal strength column when exporting data',    enabled: true  },
    { label: 'Export with Filters',     description: 'Apply active filters before exporting',             enabled: true  },
    { label: 'Auto-export on Save',     description: 'Automatically export data after each save action',  enabled: false },
    { label: 'Include GPS Coordinates', description: 'Attach location coordinates to exported records',   enabled: false },
  ],
};

@Injectable({ providedIn: 'root' })
export class SettingsPageService {

  private _settings$ = new BehaviorSubject<AppSettings>(this.loadAll());
  settings$ = this._settings$.asObservable();

  get current(): AppSettings { return this._settings$.getValue(); }
  get isLightMode(): boolean { return this.current.isLightMode; }

  constructor() {
    this.applyTheme(this.current.isLightMode);
  }
  applyTheme(isLight: boolean): void {
    const body = document.body;
    if (isLight) {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
    } else {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
    }
  }

  save(s: AppSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    this._settings$.next(s);
    this.applyTheme(s.isLightMode);
  }

  reset(): AppSettings {
    const fresh = this.clone(DEFAULTS);
    this.save(fresh);
    return fresh;
  }

  private loadAll(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return this.clone(DEFAULTS);
  }

  private clone<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)); }
}