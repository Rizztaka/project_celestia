import { ICompanionProvider } from '@/core/contracts/companion.interfaces.js';

class CompanionRegistry {
  private readonly providers = new Map<string, ICompanionProvider>();

  register(provider: ICompanionProvider): void {
    this.providers.set(provider.gameId, provider);
  }

  getProvider(gameId: string): ICompanionProvider {
    const provider = this.providers.get(gameId);
    if (!provider) {
      throw new Error(`CompanionProvider for gameId "${gameId}" is not registered.`);
    }
    return provider;
  }
}

export const companionRegistry = new CompanionRegistry();
