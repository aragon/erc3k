import { useState, useMemo } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { DAO_BY_NAME, DAO_LIST, GOVERN_REGISTRY } from 'queries/dao';
import { PROPOSAL_DETAILS, PROPOSAL_LIST } from 'queries/proposals';
import { DISPUTE } from 'queries/court';
import { courtClient } from 'index';

import {
  transformProposalDetails,
  transformProposals,
  transformDaoDetails,
} from 'utils/transforms';

const POLL_INTERVAL = 5000;

export function useDaoQuery(daoName: string) {
  const { data, loading, error, refetch } = useQuery(DAO_BY_NAME, {
    variables: { name: daoName },
  });

  const daoData = useMemo(() => {
    if (data) {
      return transformDaoDetails(data);
    }
    return null;
  }, [data]);

  return {
    data: daoData,
    loading: loading,
    error,
    refetch,
  };
}

export function useDaosQuery() {
  const { data, fetchMore, loading, error } = useQuery(DAO_LIST, {
    variables: {
      offset: 0,
      limit: 12,
    },
  });

  return { data, loading, error, fetchMore };
}

export function useGovernRegistryQuery() {
  const { data, loading, error } = useQuery(GOVERN_REGISTRY);

  return {
    data,
    loading,
    error,
  };
}

export function useLazyProposalQuery() {
  const [proposalData, setProposalData] = useState<any>(null);

  const [getProposalData, { loading }] = useLazyQuery(PROPOSAL_DETAILS, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    pollInterval: POLL_INTERVAL,
    onCompleted: (newData) => {
      const transformedData = transformProposalDetails(newData);
      setProposalData(transformedData);
    },
  });

  return { getProposalData, loading, data: proposalData };
}

export function useLazyProposalListQuery() {
  // const [proposalList, setProposalList] = useState<any>(null);
  const [getQueueData, { loading, data, error, fetchMore }] = useLazyQuery(PROPOSAL_LIST);

  // onCompleted doesn't work with lazyQuery when clicked on `fetchMore`.
  // https://github.com/apollographql/apollo-client/issues/6636
  const proposalList = useMemo(() => {
    if (data) {
      return transformProposals(data);
    }
  }, [data]);

  return {
    getQueueData,
    fetchMore: fetchMore,
    loading,
    data: proposalList,
    error,
  };
}

export function useLazyDisputeQuery(disputId: number) {
  const [getDispute, { loading, error, data }] = useLazyQuery(DISPUTE, {
    notifyOnNetworkStatusChange: true,
    variables: { id: disputId },
    client: courtClient,
  });

  return {
    getDispute,
    data,
    loading,
    error,
  };
}
