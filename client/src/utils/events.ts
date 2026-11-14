import { GatewayEventName, GatewayEventPayloadMap } from '../types/gateway';

type EventListenerEntry = {
  id: string;
  name: GatewayEventName;
  detail: unknown;
  timestamp: string;
};

const recentEvents: EventListenerEntry[] = [];

export function emitGatewayEvent<K extends GatewayEventName>(
  name: K,
  detail: GatewayEventPayloadMap[K],
  targetElement?: HTMLElement | null
): void {
  const entry: EventListenerEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    detail,
    timestamp: new Date().toISOString(),
  };
  recentEvents.unshift(entry);
  if (recentEvents.length > 25) {
    recentEvents.pop();
  }

  const event = new CustomEvent(name, {
    detail,
    bubbles: true,
    composed: true, // Crosses Shadow DOM boundary for host pages!
  });

  if (targetElement) {
    targetElement.dispatchEvent(event);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
      })
    );
  }
}

export function getRecentGatewayEvents(): EventListenerEntry[] {
  return [...recentEvents];
}
