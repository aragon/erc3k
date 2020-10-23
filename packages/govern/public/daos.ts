import { getConfiguration } from './configure'
import DAOSAction from '../internal/actions/DAOSAction'

/**
 * TODO: Define return type in promise
 *
 * @returns {Promise<any>}
 */
export default function daos(): Promise<any> {
  return new DAOSAction(getConfiguration()).execute()
}