import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private history: string[] = [];
  private storageKey = 'apphistory';

  constructor(private router: Router) {
    const stored = sessionStorage.getItem(this.storageKey);
    if (stored) {
      try {
        this.history = JSON.parse(stored);
      } catch {
        this.history = [];
      }
    }

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        console.log("AFTER REDIRECT", url, this.history);
        if (this.history.length === 0 && url!= "/") {
          if(this.history[this.history.length - 1] !== url){
            this.history.push(url);
            this.saveHistory();
          }
          
        }
          
      });
  }

  private saveHistory(): void {
    sessionStorage.setItem(this.storageKey, JSON.stringify(this.history));
  }

  canGoBack(): boolean {
    return this.history.length > 0;
  }

  back(): void {
    if (this.canGoBack()) {
      this.history.pop();
      console.log("History pop", this.history);
      this.saveHistory();
      const previousUrl = this.history[this.history.length - 1];
      this.router.navigateByUrl(previousUrl);
    }
  }
}