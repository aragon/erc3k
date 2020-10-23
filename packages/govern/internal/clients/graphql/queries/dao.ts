import gql from 'graphql-tag'
import optimisticQueue from '../fragments/optimisticQueue'
import execution from '../fragments/execution'
import role from '../fragments/role'

export default gql`
    query DAO($address: String) {
      dao(address: $address) {
        id
        address
        executions {
          ...Execution_execution
        }
        roles {
          ...Role_role
        }
        queues {
          ...OptimisticQueue_optimisticQueue
        }
      }
    }
    ${optimisticQueue}
    ${execution}
    ${role}
  `