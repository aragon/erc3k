import { Address } from '@graphprotocol/graph-ts'
import {
  Frozen as FrozenEvent,
  Granted as GrantedEvent,
  Revoked as RevokedEvent,
} from '../generated/templates/Govern/Govern'
import {
  Govern,
  Role
} from '../generated/schema'

const FREEZE_ADDR = '0x0000000000000000000000000000000000000001'

export function handleFrozen(event: FrozenEvent): void {
  const govern = Govern.load(event.address.toHexString())
  let id = 0
  const roles = govern.roles
  for (id = 0; id < roles.length; id++) {
    const currentRole = roles[id]
    const funcSelector = currentRole.split('-')[1]
    if (funcSelector === event.params.role.toHexString()) {
      const role = Role.load(currentRole)
      const freezeBytes = Address.fromString(FREEZE_ADDR)
      role.who = freezeBytes
      role.save()
      break
    }
  }
  govern.save()
}

export function handleRevoked(event: RevokedEvent): void {
  let govern = Govern.load(event.address.toHexString())
  const roleId =
    event.address.toHexString() +
    '-' +
    event.params.role.toHexString() +
    '-' +
    event.params.who.toHexString()
  let role = Role.load(roleId)
  if (!role) {
    role = new Role(roleId)
    role.role = event.params.role
    role.who = event.params.who
  }
  role.revoked = true
  // Check if role exists in roles array and if not,
  // push it
  const roles = govern.roles
  let id = 0
  let exists = false
  for(id = 0; id < roles.length; id++) {
    const currentRole = roles[id]
    if (currentRole === roleId) {
      exists = true
    }
  }

  if (!exists) {
    roles.push(roleId)
    govern.roles = roles
  }
  role.save()
  govern.save()
}

export function handleGranted(event: GrantedEvent): void {
  const govern = Govern.load(event.address.toHexString())
  // roleID = contract address + role itself,
  // which will be the function selector + who
  // This is equivalent to storing all roles in the contract, and looking up the corresponding
  // entry by mapping role => who
  const roleId =
    event.address.toHexString() +
    '-' +
    event.params.role.toHexString() +
    '-' +
    event.params.who.toHexString()
  // We MUST first try to load this event because you can "grant" the role
  // to the same addr many times, even if it has no effect.
  let role = Role.load(roleId)
  let exists = true
  if (!role) {
    exists = false
    role = new Role(roleId)
  }
  role.role = event.params.role
  role.who = event.params.who
  role.revoked = false
  const roles = govern.roles
  if (!exists) {
    roles.push(roleId)
  }
  role.save()
  govern.roles = roles
  govern.save()
}
