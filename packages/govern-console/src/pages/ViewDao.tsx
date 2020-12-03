import React from 'react'
import { Route, Switch, useRouteMatch, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { gql, request } from 'graphql-request'
import 'styled-components/macro'
import NewAction from '../components/NewAction/NewAction'
import ViewAction from '../components/ViewAction/ViewAction'
import ViewDao from '../components/ViewDao/ViewDao'
import { useChainId } from '../Providers/ChainId'
import { MAINNET_SUBGRAPH_URL, RINKEBY_SUBGRAPH_URL } from '../lib/utils'

const DAO_QUERY = gql`
  query DAOQuery($name: String) {
    registryEntry(id: $name) {
      name
      executor {
        address
        roles {
          selector
          who
          frozen
        }
      }
      queue {
        address
        roles {
          selector
          who
          frozen
        }
        queued {
          id
          state
          payload {
            nonce
            executionTime
            submitter
            proof
            actions {
              id
              to
              value
              data
            }
            executor {
              address
            }
          }
          config {
            executionDelay
            scheduleDeposit {
              token
              amount
            }
            challengeDeposit {
              token
              amount
            }
            resolver
            rules
          }
          history {
            ... on ContainerEventVeto {
              reason
            }
          }
        }
        config {
          executionDelay
          scheduleDeposit {
            token
            amount
          }
          challengeDeposit {
            token
            amount
          }
          resolver
          rules
        }
      }
    }
  }
`

export default function DaoView() {
  const { chainId } = useChainId()
  const { daoAddress }: any = useParams()
  const { path } = useRouteMatch()
  const { data, isLoading: loading, error } = useQuery('DAO_DATA', async () => {
    const res = await request(
      chainId === 4 ? RINKEBY_SUBGRAPH_URL : MAINNET_SUBGRAPH_URL,
      DAO_QUERY,
      {
        name: daoAddress,
      },
    )

    return res
  })

  if (loading) {
    return <p>Loading DAO data...</p>
  }

  if (error) {
    console.error(error)
    return <p>Error fetching DAO data.</p>
  }

  if (!data.registryEntry) {
    return <p>DAO not found.</p>
  }

  return (
    <Switch>
      <Route exact path={path}>
        <ViewDao dao={data.registryEntry} />
      </Route>
      <Route path={`${path}/new-action`}>
        <NewAction
          config={data.registryEntry.queue.config}
          executorAddress={data.registryEntry.executor.address}
          queueAddress={data.registryEntry.queue.address}
        />
      </Route>
      <Route path={`${path}/view-action/:containerId`}>
        <ViewAction
          containers={data.registryEntry.queue.queued}
          queueAddress={data.registryEntry.queue.address}
        />
      </Route>
      <Route>
        <h2>Route not found :(</h2>
      </Route>
    </Switch>
  )
}
