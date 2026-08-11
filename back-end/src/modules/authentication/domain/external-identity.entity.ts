import isNullOrUndefined from 'src/shared/lib/isNullOrUndefined';
import type { ExternalProvider } from './external-identity.types';

interface IExternalIdentity {
  id?: string;
  provider: ExternalProvider;
  providerSubject: string;
  userId: string;
  providerEmail: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export default class ExternalIdentity {
  props: IExternalIdentity;

  private constructor(props: IExternalIdentity) {
    this.props = props;
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get provider(): ExternalProvider {
    return this.props.provider;
  }

  get providerSubject(): string {
    return this.props.providerSubject;
  }

  get userId(): string {
    return this.props.userId;
  }

  get providerEmail(): string | null {
    return this.props.providerEmail;
  }

  public isPersisted(): this is ExternalIdentity & { id: string } {
    return !isNullOrUndefined(this.props.id);
  }

  public static createNew(
    props: Omit<IExternalIdentity, 'id' | 'createdAt' | 'updatedAt'>,
  ): ExternalIdentity {
    return new ExternalIdentity(props);
  }

  public static reconstitute(props: IExternalIdentity): ExternalIdentity {
    if (!props.id) {
      throw new Error('ID is required for reconstituting external identity');
    }
    return new ExternalIdentity(props);
  }
}
