import GamesAction from '../../../internal/actions/GamesAction'

/**
 * GamesAction test
 */
describe('GamesActionTest', () => {
  it('calls the constructor and initiates the class as expected', () => {
    new GamesAction({address: '0x28c04471ce4f5d1f027ca5f69faa5678c6f87937'})
  })

  it('calls the constructor and throws the expected error', () => {
    expect(() => {
      new GamesAction({address: '0x00'})
    }).toThrow('Invalid Ethereum address passed!')
  })
})