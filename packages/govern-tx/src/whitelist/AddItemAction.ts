import {isAddress} from '@ethersproject/address'
import AbstractWhitelistAction from "../../lib/whitelist/AbstractWhitelistAction"
import {ListItem} from '../db/Whitelist'

export default class AddItemAction extends AbstractWhitelistAction {
    /**
      * Validates the given parameters.
      * 
      * @method validateParameters 
      * 
      * @param {Object} parameters 
      * 
      * @returns {Object}
      * 
      * @protected
      */
     protected validateParameters(parameters: any): any {
        if (!isAddress(this.parameters.message.publicKey)) {
            throw new Error('Invalid public key passed!')
        }

        if (this.parameters.message.rateLimit == 0) {
            throw new Error('Invalid rate limit passed!')
        }

        return parameters;
    }

    /**
     * Adds a new item to the whitelist
     * 
     * @method execute
     * 
     * @returns {Promise<ListItem>}
     * 
     * @public
     */
    public execute(): Promise<ListItem> {
        return this.whitelist.addItem(
            this.parameters.publicKey,
            this.parameters.rateLimit
        )
    }
}
