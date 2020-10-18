import { Address } from '@graphprotocol/graph-ts'
import {
  Registered as RegisteredEvent,
  SetMetadata as SetMetadataEvent
} from '../generated/ERC3000Registry/ERC3000Registry'
import {
  Govern as GovernTemplate,
  OptimisticQueue as QueueTemplate
} from '../generated/templates'
import {
  ERC3000Registry as ERC3000RegistryEntity,
  OptimisticGame as OptimisticGameEntity
} from '../generated/schema'

export function handleRegistered(event: RegisteredEvent): void {
  const registry = loadOrCreateRegistry(event.address)

  const game = new OptimisticGameEntity(event.params.name)

  game.name = event.params.name
  game.executor = event.params.dao.toHexString()
  game.queue = event.params.queue.toHexString()

  // add game to the registry
  const currentEntries = registry.games
  currentEntries.push(game.id)
  registry.games = currentEntries

  registry.count += 1

  game.save()
  registry.save()

  // Create datasource templates
  GovernTemplate.create(event.params.dao)
  QueueTemplate.create(event.params.queue)
}

export function handleSetMetadata(event: SetMetadataEvent): void {
  // TODO: (Gabi) how we link the metadata with the Optimistic Game
}

export function loadOrCreateRegistry(
  registryAddress: Address
): ERC3000RegistryEntity {
  const registryId = registryAddress.toHexString()
  let registry = ERC3000RegistryEntity.load(registryId)
  if (registry === null) {
    registry = new ERC3000RegistryEntity(registryId)
    registry.address = registryAddress
    registry.count = 0
    registry.games = []
  }
  return registry!
}