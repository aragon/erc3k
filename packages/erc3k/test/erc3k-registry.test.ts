import { ethers } from '@nomiclabs/buidler'
import { expect } from 'chai'
import {
  Erc3000Registry,
  Erc3000RegistryFactory,
  Erc3000Mock,
  Erc3000Factory,
  Erc3000ExecutorMock,
  Erc3000ExecutorMockFactory,
  Erc3000BadInterfaceMockFactory,
  Erc3000ExecutorBadInterfaceMockFactory
} from '../typechain'

const ERRORS = {
  NAME_USED: 'registry: name used',
  BAD_INTERFACE_QUEUE: 'registry: bad interface queue',
  BAD_INTERFACE_DAO: 'registry: bad interface dao'
}

const EVENTS = {
  REGISTERED: 'Registered',
  SET_METADATA: 'SetMetadata'
}

describe('ERC3000 Executor', function() {
  let erc3kRegistry: Erc3000Registry,
    erc3k: Erc3000Mock,
    erc3kExec: Erc3000ExecutorMock

  beforeEach(async () => {
    const ERC3000 = (await ethers.getContractFactory(
      'ERC3000'
    )) as Erc3000Factory

    const ERC3000Registry = (await ethers.getContractFactory(
      'ERC3000Registry'
    )) as Erc3000RegistryFactory

    const ERC3000Executor = (await ethers.getContractFactory(
      'ERC3000ExecutorMock'
    )) as Erc3000ExecutorMockFactory

    erc3kExec = await ERC3000Executor.deploy()
    erc3k = await ERC3000.deploy()
    erc3kRegistry = await ERC3000Registry.deploy()
  })

  it('calls register and is able the register the executor and queue', async () => {
    await expect(erc3kRegistry.register(erc3kExec.address, erc3k.address, 'MyName', '0x00'))
      .to.emit(erc3kRegistry, EVENTS.REGISTERED)
      .withArgs(erc3kExec.address, erc3k.address, '0x0', 'MyName')
      .to.emit(erc3kRegistry, EVENTS.SET_METADATA)
      .withArgs(erc3kExec.address, '0x00')
  })

  it('calls register and reverts cause the name is already used', async () => {
    erc3kRegistry.register(erc3kExec.address, erc3k.address, 'MyName', '0x00')

    await expect(erc3kRegistry.register(erc3kExec.address, erc3k.address, 'MyName', '0x00'))
      .to.be.revertedWith(ERRORS.NAME_USED)
  })

  it('calls register and reverts cause the queue has a wrong interface', async () => {
    const ERC3000BadInterfaceMock = (await ethers.getContractFactory(
      'ERC3000BadInterfaceMock'
    )) as Erc3000BadInterfaceMockFactory

    const erc3kBadInterface = ERC3000BadInterfaceMock.deploy()

    await expect(erc3kRegistry.register(erc3kExec.address, erc3kBadInterface.address, 'MyName', '0x00'))
      .to.be.revertedWith(ERRORS.BAD_INTERFACE_QUEUE)
  })

  it('calls register and reverts cause the dao has a wrong interface', async () => {
    const ERC3000ExecutorBadInterfaceMock = (await ethers.getContractFactory(
      'ERC3000BadInterfaceMock'
    )) as Erc3000ExecutorBadInterfaceMockFactory

    const erc3kExecBadInterface = ERC3000ExecutorBadInterfaceMock.deploy()

    await expect(erc3kRegistry.register(erc3kExec.address, erc3kExecBadInterface.address, 'MyName', '0x00'))
      .to.be.revertedWith(ERRORS.BAD_INTERFACE_DAO)
  })
})
