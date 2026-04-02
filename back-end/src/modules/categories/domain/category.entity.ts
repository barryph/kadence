import isNullOrUndefined from 'src/shared/lib/isNullOrUndefined';

export interface ICategory {
  id?: string;
  userId: string;
  name: string;
  color: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default class Category {
  props: ICategory;

  private constructor(props: ICategory) {
    this.props = props;
  }

  get id(): string | undefined {
    if (isNullOrUndefined(this.props.id)) {
      throw new Error('Category has not been persisted yet');
    }
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get color(): string {
    return this.props.color;
  }

  public isPersisted(): this is ICategory & { id: string } {
    return !isNullOrUndefined(this.props.id);
  }

  public ensurePersisted(): asserts this is ICategory & { id: string } {
    if (isNullOrUndefined(this.props.id)) {
      throw new Error('Category must be persisted before this operation');
    }
  }

  private static validate(props: ICategory) {
    if (
      isNullOrUndefined(props.userId) ||
      isNullOrUndefined(props.name) ||
      isNullOrUndefined(props.color)
    ) {
      throw new Error('Category Failed Validation');
    }
  }

  public static createNew(props: ICategory) {
    this.validate(props);
    return new Category(props);
  }

  public static reconstitute(props: ICategory): Category {
    if (!props.id) {
      throw new Error('ID is required for reconstituting category');
    }
    this.validate(props);
    return new Category(props);
  }
}
