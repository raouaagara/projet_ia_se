import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';

export interface WsNotification {
  id:            number;
  titre:         string;
  message:       string;
  type:          string;
  lue:           boolean;
  dateCreation:  string;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {

  private client!:      Client;
  private connected  =  false;
  private notifSubj  =  new Subject<WsNotification>();
  private countSubj  =  new Subject<number>();
  private subs:         StompSubscription[] = [];

  readonly notification$: Observable<WsNotification> = this.notifSubj.asObservable();
  readonly count$:         Observable<number>          = this.countSubj.asObservable();

  connect(utilisateurId: number): void {
    if (this.connected) return;

    this.client = new Client({
      // WebSocket natif + endpoint SockJS-compatible côté Spring
      brokerURL: 'ws://localhost:8081/ws/websocket',
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;

        const s1 = this.client.subscribe(
          `/user/${utilisateurId}/queue/notifications`,
          (msg: IMessage) => {
            try { this.notifSubj.next(JSON.parse(msg.body)); } catch {}
          }
        );
        const s2 = this.client.subscribe(
          `/user/${utilisateurId}/queue/notif-count`,
          (msg: IMessage) => {
            try { const { count } = JSON.parse(msg.body); this.countSubj.next(count); } catch {}
          }
        );
        this.subs.push(s1, s2);
      },
      onDisconnect: () => { this.connected = false; },
      onStompError:  () => { this.connected = false; },
      onWebSocketError: () => { this.connected = false; }
    });

    try { this.client.activate(); } catch { /* WebSocket non disponible */ }
  }

  disconnect(): void {
    this.subs.forEach(s => { try { s.unsubscribe(); } catch {} });
    this.subs = [];
    if (this.client?.active) { try { this.client.deactivate(); } catch {} }
    this.connected = false;
  }

  isConnected(): boolean { return this.connected; }

  ngOnDestroy(): void { this.disconnect(); }
}
