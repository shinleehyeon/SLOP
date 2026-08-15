import type { RbacAction, RbacEntity } from './rbac.definitions';

export function perm<E extends RbacEntity, A extends RbacAction<E>>(
  entity: E,
  action: A,
): `${E & string}@${A & string}` {
  return `${entity}@${action}`;
}

export function grantEntity<E extends RbacEntity>(entity: E): E {
  return entity;
}

export function inheritEntity<E extends RbacEntity>(entity: E): `&${E}` {
  return `&${entity}`;
}
