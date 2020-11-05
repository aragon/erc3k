import { ethers } from '@nomiclabs/buidler'
import { expect } from 'chai'
import {
  GovernQueue,
  GovernQueueFactory,
  TestToken,
  TestTokenFactory
  // ArbitratorMock,
  // ArbitratorMockFactory,
  // ArbitratorBadFeePullMock,
  // ArbitratorBadFeePullMockFactory,
  // ArbitratorBadApproveMock,
  // ArbitratorBadApproveMockFactory,
  // ArbitratorBadResetMock,
  // ArbitratorBadResetMockFactory,
  // ArbitratorRejectMock,
  // ArbitratorRejectMockFactory,
  // ArbitratorNoStateChangeOnRejectMock,
  // ArbitratorNoStateChangeOnRejectMockFactory,
  // ArbitratorCallsRuleMock,
  // ArbitratorCallsRuleMockFactory
} from '../../typechain'
import {container as containerJson} from './container'
import { getConfigHash, getContainerHash, getPayloadHash } from './helpers'
import { formatBytes32String, keccak256, toUtf8Bytes } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'

// TODO: Create mock contract to check the return values of public methods
describe('Govern Queue', function() {
  let ownerAddr: string,
    testToken: TestToken,
    chainId: number,
    gq: GovernQueue,
    container: any

  const EVENTS = {
    SCHEDULED: 'Scheduled',
    LOCK: 'Lock',
    UNLOCK: 'Unlock',
    EXECUTED: 'Executed',
    CHALLENGED: 'Challenged',
    EVIDENCE_SUBMITTED: 'EvidenceSubmitted',
    VETOED: 'Vetoed',
    CONFIGURED: 'Configured',
    RESOLVED: 'Resolved',
    RULED: 'Ruled'
  }

  const ERRORS = {
    BAD_NONCE: 'queue: bad nonce',
    BAD_CONFIG: 'queue: bad config',
    BAD_DELAY: 'queue: bad delay',
    BAD_SUBMITTER: 'queue: bad submitter',
    WAIT_MORE: 'queue: wait more',
    BAD_FEE_PULL: 'queue: bad fee pull',
    BAD_APPROVE: 'queue: bad approve',
    BAD_RESET: 'queue: bad reset',
    UNRESOLVED: 'queue: unresolved',
    EVIDENCE: 'queue: evidence'
  }

  const STATE = {
    NONE: 0,
    SCHEDULED: 1,
    CHALLENGED: 2,
    APPROVED: 3,
    REJECTED: 4,
    CANCELLED: 5,
    EXECUTED: 6
  }

  const ownerTokenAmount = 1000000;

  before(async () => {
    chainId = (await ethers.provider.getNetwork()).chainId
    ownerAddr = await (await ethers.getSigners())[0].getAddress()
    containerJson.payload.submitter = ownerAddr

    const TestToken = (await ethers.getContractFactory(
      'TestToken'
    )) as TestTokenFactory
    testToken = (await TestToken.deploy(ownerAddr)) as TestToken

    await testToken.mint(ownerAddr, 1000000)

    containerJson.config.scheduleDeposit.token = testToken.address
    containerJson.config.challengeDeposit.token = testToken.address
    containerJson.config.vetoDeposit.token = testToken.address

    const GQ = (await ethers.getContractFactory(
      'GovernQueue'
    )) as GovernQueueFactory
    gq = (await GQ.deploy(ownerAddr, containerJson.config)) as GovernQueue

    await gq.bulk([
      {
        op: 0,
        role: gq.interface.getSighash(gq.interface.getFunction('schedule')),
        who: ownerAddr
      },
      {
        op: 0,
        role: gq.interface.getSighash(gq.interface.getFunction('execute')),
        who: ownerAddr
      },
      {
        op: 0,
        role: gq.interface.getSighash(gq.interface.getFunction('challenge')),
        who: ownerAddr
      },
      {
        op: 0,
        role: gq.interface.getSighash(gq.interface.getFunction('configure')),
        who: ownerAddr
      },
      {
        op: 0,
        role: gq.interface.getSighash(gq.interface.getFunction('veto')),
        who: ownerAddr
      }
    ])
  })

  context('GovernQueue.schedule', () => {
    beforeEach(async () => {
      container = JSON.parse(JSON.stringify(containerJson))
      container.payload.executionTime = (
        await ethers.provider.getBlock('latest')
      ).timestamp + 1000
    })

    it('emits the expected events and adds the container to the queue', async () => {
      await testToken.approve(gq.address, container.config.scheduleDeposit.amount)

      await expect(gq.schedule(container))
        .to.emit(gq, EVENTS.SCHEDULED)

      expect(
        await gq.queue(getContainerHash(container, gq.address, chainId))
      ).to.equal(STATE.SCHEDULED)

      expect(
        await testToken.balanceOf(ownerAddr)
      ).to.equal(ownerTokenAmount - container.config.scheduleDeposit.amount)
    })

    it('reverts with "queue: bad config"', async () => {
      container.config.executionDelay = 100

      await expect(
        gq.schedule(container)
      ).to.be.revertedWith(ERRORS.BAD_CONFIG)
    })

    it('reverts with "queue: bad delay"', async () => {
      container.payload.executionTime = 0

      await expect(
        gq.schedule(container)
      ).to.be.revertedWith(ERRORS.BAD_DELAY)
    })

    it('reverts with "queue: bad submitter"', async () => {
      container.payload.submitter = '0x0000000000000000000000000000000000000000'

      await expect(
        gq.schedule(container)
      ).to.be.revertedWith(ERRORS.BAD_SUBMITTER)
    })

    it('reverts with "queue: bad nonce"', async () => {
      await expect(
        gq.schedule(container)
      ).to.be.revertedWith(ERRORS.BAD_NONCE)
    })
  })

  // context('GovernQueue.execute', async () => {
  //   before(async () => {
  //     container.payload.executionTime = (
  //       await ethers.getDefaultProvider().getBlock('latest')
  //     ).timestamp
  //     container.payload.nonce = await gq.nonce()
  //     await gq.schedule(container)
  //   })
  //
  //   it('emits the expected events and updates the container state', async () => {
  //     const containerHash = getContainerHash(container, ownerAddr, chainId)
  //
  //     await expect(gq.execute(container))
  //       .to.emit(gq, EVENTS.UNLOCK).withArgs(
  //         container.config.scheduleDeposit.token,
  //         ownerAddr,
  //         container.config.scheduleDeposit.amount
  //       ).to.emit(gq, EVENTS.EXECUTED).withArgs(
  //         containerHash,
  //         ownerAddr
  //       )
  //
  //     expect(await gq.queue(containerHash)).to.equal({ state: 'Executed' })
  //   })
  //
  //   it('reverts with "queue: wait more"', async () => {
  //     container.payload.executionTime = container.payload.executionTime * 2
  //
  //     await expect(gq.execute(container)).to.be.revertedWith(ERRORS.WAIT_MORE)
  //   })
  // })
  //
  // context('GovernQueue.challenge', () => {
  //   before(async () => {
  //     container.payload.executionTime = (
  //       await ethers.getDefaultProvider().getBlock('latest')
  //     ).timestamp
  //   })
  //
  //   it('executes as expected', async () => {
  //     container.payload.nonce = await gq.nonce()
  //
  //     await gq.schedule(container)
  //
  //     const ArbitratorMock = (await ethers.getContractFactory(
  //       'ArbitratorMock'
  //     )) as ArbitratorMockFactory
  //     const arbitratorMock = await ArbitratorMock.deploy()
  //
  //     container.config.resolver = arbitratorMock.address
  //     const containerHash = getContainerHash(container, ownerAddr, chainId)
  //     const reasonAsBytes32 = formatBytes32String('NOPE!')
  //     const disputeId = container.payload.nonce
  //
  //     await expect(gq.challenge(container, reasonAsBytes32))
  //       .to.emit(gq, EVENTS.LOCK).withArgs(
  //         container.config.challengeDeposit.token,
  //         ownerAddr,
  //         container.config.challengeDeposit.amount
  //       ).to.emit(gq, EVENTS.CHALLENGED).withArgs(
  //         containerHash,
  //         ownerAddr,
  //         reasonAsBytes32,
  //         disputeId,
  //         container.config.challengeDeposit
  //       ).to.emit(gq, EVENTS.EVIDENCE_SUBMITTED).withArgs(
  //         container.config.resolver,
  //         disputeId,
  //         container.payload.submitter,
  //         container.payload.proof,
  //         true
  //       ).to.emit(gq, EVENTS.EVIDENCE_SUBMITTED).withArgs(
  //         container.config.resolver,
  //         disputeId,
  //         ownerAddr,
  //         reasonAsBytes32,
  //         true
  //       )
  //
  //     expect(await gq.queue(containerHash))
  //       .to.equal({ state: 'Challenged' })
  //
  //     expect(await gq.challengerCache(containerHash))
  //       .to.equal(ownerAddr)
  //
  //     expect(await gq.disputeItemCache(container.config.resolver, disputeId))
  //       .to.equal(containerHash)
  //   })
  //
  //   it('reverts with "queue: bad fee pull"', async () => {
  //     container.payload.nonce = await gq.nonce()
  //     container.payload.proof = '0x01'
  //
  //     await gq.schedule(container)
  //
  //     const ArbitratorBadFeePullMock = (await ethers.getContractFactory(
  //       'ArbitratorBadFeePullMock'
  //     )) as ArbitratorBadFeePullMockFactory
  //     const arbitratorBadFeePullMock = await ArbitratorBadFeePullMock.deploy()
  //
  //     container.config.resolver = arbitratorBadFeePullMock.address
  //
  //     await expect(gq.challenge(container, formatBytes32String('NOPE!')))
  //       .to.be.revertedWith(ERRORS.BAD_FEE_PULL)
  //   })
  //
  //   it('reverts with "queue: bad approve"', async () => {
  //     container.payload.nonce = await gq.nonce()
  //     container.payload.proof = '0x02'
  //
  //     await gq.schedule(container)
  //
  //     const ArbitratorBadApproveMock = (await ethers.getContractFactory(
  //       'ArbitratorBadApproveMock'
  //     )) as ArbitratorBadApproveMock
  //     const arbitratorBadApproveMock = await ArbitratorBadApproveMock.deploy()
  //
  //     container.config.resolver = arbitratorBadApproveMock.address
  //
  //     await expect(gq.challenge(container, formatBytes32String('NOPE!')))
  //       .to.be.revertedWith(ERRORS.BAD_APPROVE)
  //   })
  //
  //   it('reverts with "queue: bad reset"', async () => {
  //     container.payload.nonce = await gq.nonce()
  //     container.payload.proof = '0x03'
  //
  //     await gq.schedule(container)
  //
  //     const ArbitratorBadResetMock = (await ethers.getContractFactory(
  //       'ArbitratorBadResetMock'
  //     )) as ArbitratorBadResetMock
  //     const arbitratorBadResetMock = await ArbitratorBadResetMock.deploy()
  //
  //     container.config.resolver = arbitratorBadResetMock.address
  //
  //     await expect(gq.challenge(container, formatBytes32String('NOPE!')))
  //       .to.be.revertedWith(ERRORS.BAD_RESET)
  //   })
  // })
  //
  // context('GovernQueue.resolve', () => {
  //   before(async () => {
  //     container.payload.executionTime = (
  //       await ethers.getDefaultProvider().getBlock('latest')
  //     ).timestamp
  //   })
  //
  //   it('emits resolved with approved true', async () => {
  //     container.payload.nonce = await gq.nonce()
  //     await gq.schedule(container)
  //
  //     const containerHash = getContainerHash(container, ownerAddr, chainId)
  //     const disputeId = container.payload.nonce
  //
  //     await expect(gq.resolve(container, disputeId))
  //       .to.emit(gq, EVENTS.UNLOCK).withArgs(
  //         container.config.scheduleDeposit.token,
  //         ownerAddr,
  //         container.config.scheduleDeposit.amount
  //       ).to.emit(gq, EVENTS.RESOLVED).withArgs(
  //         containerHash,
  //         ownerAddr,
  //         true
  //       ).to.emit(gq, EVENTS.EXECUTED).withArgs(
  //         containerHash,
  //         ownerAddr
  //       )
  //
  //     expect(await gq.queue(containerHash)).to.equal({ state: 'Executed' })
  //   })
  //
  //   it('emits resolved with approved false', async () => {
  //     container.payload.nonce = await gq.nonce()
  //     await gq.schedule(container)
  //
  //     const containerHash = getContainerHash(container, ownerAddr, chainId)
  //     const disputeId = container.payload.nonce
  //
  //     await expect(gq.resolve(container, disputeId))
  //       .to.emit(gq, EVENTS.UNLOCK).withArgs(
  //         container.config.scheduleDeposit.token,
  //         ownerAddr,
  //         container.config.scheduleDeposit.amount
  //       ).to.emit(gq, EVENTS.RESOLVED).withArgs(
  //         containerHash,
  //         ownerAddr,
  //         true
  //       ).to.emit(gq, EVENTS.EXECUTED).withArgs(
  //         containerHash,
  //         ownerAddr
  //       )
  //
  //     expect(await gq.queue(containerHash)).to.equal({ state: 'Executed' })
  //   })
  //
  //   it('executes the arbitrator ruling and emits the expected events', async () => {
  //     const ArbitratorMock = (await ethers.getContractFactory(
  //       'ArbitratorMock'
  //     )) as ArbitratorMockFactory
  //     const arbitratorMock = await ArbitratorMock.deploy()
  //
  //     container.config.resolver = arbitratorMock.address
  //     container.payload.nonce = await gq.nonce()
  //
  //     await gq.configure(container.config)
  //     await gq.schedule(container)
  //     await gq.challenge(container, formatBytes32String('NOPE!'))
  //
  //     const containerHash = getContainerHash(container, ownerAddr, chainId)
  //     const disputeId = container.payload.nonce
  //
  //     await expect(gq.resolve(container, disputeId))
  //       .to.emit(gq, EVENTS.UNLOCK).withArgs(
  //         container.config.scheduleDeposit.token,
  //         ownerAddr,
  //         container.config.scheduleDeposit.amount
  //       ).to.emit(gq, EVENTS.RESOLVED).withArgs(
  //         containerHash,
  //         ownerAddr
  //       ).to.emit(gq, EVENTS.EXECUTED).withArgs(
  //         containerHash,
  //         ownerAddr
  //       )
  //
  //     expect(await gq.queue(containerHash)).to.equal({ state: 'Executed' })
  //   })
  //
  //   it('emits resolved with approved false and rejects', async () => {
  //     const ArbitratorRejectMock = (await ethers.getContractFactory(
  //       'ArbitratorRejectMock'
  //     )) as ArbitratorRejectMockFactory
  //     const arbitratorRejectMock = await ArbitratorRejectMock.deploy()
  //
  //     container.config.resolver = arbitratorRejectMock.address
  //     container.payload.nonce = await gq.nonce()
  //
  //     await gq.configure(container.config)
  //     await gq.schedule(container)
  //     await gq.challenge(container, formatBytes32String('NOPE!'))
  //
  //     const containerHash = getContainerHash(container, ownerAddr, chainId)
  //     const disputeId = container.payload.nonce
  //
  //     await expect(gq.resolve(container, disputeId))
  //       .to.emit(gq, EVENTS.UNLOCK).withArgs(
  //         container.config.scheduleDeposit.token,
  //         ownerAddr,
  //         container.config.scheduleDeposit.amount
  //       ).to.emit(gq, EVENTS.UNLOCK).withArgs(
  //         container.config.challengeDeposit.token,
  //         ownerAddr,
  //         container.config.challengeDeposit.amount
  //       ).to.emit(gq, EVENTS.RESOLVED).withArgs(
  //         containerHash,
  //         ownerAddr,
  //         false
  //       )
  //
  //     // TODO: Check if event is actually missing with Jorge
  //     // .to.emit(gq, EVENTS.REJECTED).withArgs(
  //     //   containerHash,
  //     //   ownerAddr
  //     // )
  //
  //     expect(await gq.challengerCache(containerHash))
  //       .to.equal('0x0000000000000000000000000000000000000000')
  //
  //     expect(await gq.queue(containerHash))
  //       .to.equal({ state: 'Cancelled' })
  //   })
  //
  //   it('reverts with "queue: unresolved"', async () => {
  //     const ArbitratorNoStateChangeOnRejectMock = (await ethers.getContractFactory(
  //       'ArbitratorNoStateChangeOnRejectMock'
  //     )) as ArbitratorNoStateChangeOnRejectMockFactory
  //     const arbitratorNoStateChangeOnRejectMock = await ArbitratorNoStateChangeOnRejectMock.deploy()
  //
  //     container.config.resolver = arbitratorNoStateChangeOnRejectMock.address
  //     container.payload.nonce = await gq.nonce()
  //
  //     await gq.configure(container.config)
  //     await gq.schedule(container)
  //     await gq.challenge(container, formatBytes32String('NOPE!'))
  //
  //     const disputeId = container.payload.nonce
  //
  //     await expect(gq.resolve(container, disputeId))
  //       .to.be.revertedWith(ERRORS.UNRESOLVED)
  //   })
  // })
  //
  // context('GovernQueue.veto', () => {
  //   it('runs as expected', async () => {
  //     const containerHash = getContainerHash(container, ownerAddr, chainId)
  //     const reasonAsBytes32 = formatBytes32String('NOPE!')
  //
  //     await expect(gq.veto(containerHash, reasonAsBytes32))
  //       .to.emit(gq, EVENTS.VETOED).withArgs(
  //         containerHash,
  //         ownerAddr,
  //         reasonAsBytes32
  //       )
  //
  //     expect(await gq.queue(containerHash)).to.equal({ state: 'Cancelled' })
  //   })
  // })
  //
  // context('GovernQueue.configure', () => {
  //   it('updated the configuration as expected', async () => {
  //     const configHash = getConfigHash(container)
  //
  //     await expect(gq.configure(container.config))
  //       .to.emit(gq, EVENTS.CONFIGURED).withArgs(
  //         configHash,
  //         ownerAddr,
  //         container.config
  //       )
  //
  //     expect(await gq.configHash()).to.equal(configHash)
  //   })
  // })
  //
  // context('GovernQueue.executeApprove', () => {
  //   it('emits the expected events', async () => {
  //     const containerHash = getContainerHash(container, ownerAddr, chainId)
  //
  //     await expect(gq.executeApproved(container))
  //       .to.emit(gq, EVENTS.UNLOCK).withArgs(
  //         container.config.scheduleDeposit.token,
  //         ownerAddr,
  //         container.config.scheduleDeposit.amount
  //       ).to.emit(gq, EVENTS.UNLOCK).withArgs(
  //         container.config.challengeDeposit.token,
  //         ownerAddr,
  //         container.config.challengeDeposit.amount
  //       ).to.emit(gq, EVENTS.EXECUTED).withArgs(
  //         containerHash,
  //         ownerAddr
  //       )
  //
  //     expect(await gq.queue(containerHash))
  //       .to.equal({ state: 'Executed' })
  //
  //     expect(await gq.challengerCache(containerHash))
  //       .to.equal('0x0000000000000000000000000000000000000000')
  //   })
  // })
  //
  // context('GovernQueue.settleRejection', () => {
  //   it('clears anything as expected', async () => {
  //     await expect(gq.settleRejection(container))
  //       .to.emit(gq, EVENTS.UNLOCK).withArgs(
  //         container.config.scheduleDeposit.token,
  //         ownerAddr,
  //         container.config.scheduleDeposit.amount
  //       ).to.emit(gq, EVENTS.UNLOCK).withArgs(
  //         container.config.challengeDeposit.token,
  //         ownerAddr,
  //         container.config.challengeDeposit.amount
  //       )
  //
  //     expect(await gq.challengerCache(getContainerHash(container, ownerAddr, chainId)))
  //       .to.equal('0x0000000000000000000000000000000000000000')
  //   })
  // })
  //
  // context('GovernQueue.rule', () => {
  //   it('sets the state to "Approved" and clears the disputeItemCache', async () => {
  //     const ArbitratorCallsRuleMock = (await ethers.getContractFactory(
  //       'ArbitratorCallsRuleMock'
  //     )) as ArbitratorCallsRuleMockFactory
  //     const arbitratorCallsRuleMock = await ArbitratorCallsRuleMock.deploy()
  //
  //     container.config.resolver = arbitratorCallsRuleMock.address
  //
  //     await gq.configure(container.config)
  //     await gq.schedule(container)
  //     await gq.challenge(container, formatBytes32String('NOPE!'))
  //
  //     const disputeId = container.payload.nonce
  //
  //     await expect(arbitratorCallsRuleMock.execRule(disputeId, 4))
  //       .to.emit(gq, EVENTS.RULED).withArgs(
  //         arbitratorCallsRuleMock.address,
  //         disputeId,
  //         4
  //       )
  //
  //     expect(await gq.queue(getContainerHash(container, ownerAddr, chainId)))
  //       .to.equal({ state: 'Approved' })
  //
  //     expect(await gq.disputeItemCache(container.config.resolver, disputeId))
  //       .to.equal('0x0000000000000000000000000000000000000000')
  //   })
  //
  //   it('sets the state to "Rejected" and clears the disputeItemCache', async () => {
  //     const ArbitratorCallsRuleMock = (await ethers.getContractFactory(
  //       'ArbitratorCallsRuleMock'
  //     )) as ArbitratorCallsRuleMockFactory
  //     const arbitratorCallsRuleMock = await ArbitratorCallsRuleMock.deploy()
  //
  //     container.config.resolver = arbitratorCallsRuleMock.address
  //
  //     await gq.configure(container.config)
  //     await gq.schedule(container)
  //     await gq.challenge(container, formatBytes32String('NOPE!'))
  //
  //     const disputeId = container.payload.nonce
  //
  //     await expect(arbitratorCallsRuleMock.execRule(disputeId, 0))
  //       .to.emit(gq, EVENTS.RULED).withArgs(
  //         arbitratorCallsRuleMock.address,
  //         disputeId,
  //         0
  //       )
  //
  //     expect(await gq.queue(getContainerHash(container, ownerAddr, chainId)))
  //       .to.equal({ state: 'Rejected' })
  //
  //     expect(await gq.disputeItemCache(container.config.resolver, disputeId))
  //       .to.equal('0x0000000000000000000000000000000000000000')
  //   })
  // })
  //
  // context('GovernQueue.submitEvidence', () => {
  //   it('reverts as expected', async () => {
  //     await expect(gq.submitEvidence(100, '0x00', false))
  //       .to.be.revertedWith(ERRORS.EVIDENCE)
  //   })
  // })
  //
  // context('ERC-165', () => {
  //   const ERC165_INTERFACE_ID = '0x01ffc9a7'
  //   const ERC3000_INTERFACE_ID = '0x45f1d4aa'
  //   it('supports ERC-165', async () => {
  //     expect(await gq.supportsInterface(ERC165_INTERFACE_ID)).to.equal(true)
  //   })
  //
  //   it('supports ERC-3000', async () => {
  //     expect(await gq.supportsInterface(ERC3000_INTERFACE_ID)).to.equal(true)
  //   })
  //
  //   it('doesn\'t support random interfaceID', async () => {
  //     expect(await gq.supportsInterface('0xabababab')).to.equal(false)
  //   })
  // })
})
