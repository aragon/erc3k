import React, { useState, useEffect } from 'react';
import { styled, useTheme } from '@material-ui/core/styles';
import { ConsoleHeader } from '../../components/ConsoleHeader/ConsoleHeader';
import { DaoCard } from '../../components/DaoCards/DaoCard';
import { ANButton } from '../../components/Button/ANButton';
import Paper from '@material-ui/core/Paper';
import { useQuery } from '@apollo/client';
import { GET_DAO_LIST, GET_GOVERN_REGISTRY_DATA } from './queries';
import { Link } from 'react-router-dom';
export interface ConsoleMainPageProps {
  /**
   * Callback on selection of Dao
   */
  updateSelectedDao: any;
}

export const ConsoleMainPage: React.FC<ConsoleMainPageProps> = ({
  updateSelectedDao,
  ...props
}) => {
  const theme = useTheme();
  const [visibleDaoList, updateDaoList] = useState<any>([]);
  const [totalDaoCount, updateTotalDaoCount] = useState<number>();

  const ConsoleMainDiv = styled(Paper)({
    width: '100%',
    background: theme.custom.mainBackground,
    height: 'auto',
    padding: '0px',
    boxShadow: 'none',
  });

  const {
    data: daoListData,
    loading: isLoadingDaoList,
    error: errorLoadingDaoList,
    fetchMore: fetchMoreDaos,
  } = useQuery(GET_DAO_LIST, {
    variables: {
      offset: 0,
      limit: 12,
    },
  });

  const {
    data: registryData,
    loading: isLoadingRegistryData,
    error: errorLoadingRegistryData,
  } = useQuery(GET_GOVERN_REGISTRY_DATA);

  // const getTotalNumberOfDaos = () => {
  //   updateTotalDaoCount(numberOfDaos);
  // };

  useEffect(() => {
    if (daoListData && daoListData.daos) {
      updateDaoList([...daoListData.daos]);
    }
  }, [daoListData]);

  useEffect(() => {
    if (registryData) {
      updateTotalDaoCount(registryData.governRegistries[0].count);
    }
  }, [registryData]);

  return (
    <ConsoleMainDiv>
      <ConsoleHeader />
      <div
        style={{
          width: '100%',
          // maxWidth: '1408px',
          display: 'grid',
          gridTemplateColumns: 'auto auto auto auto',
          justifyContent: 'space-between',
        }}
      >
        {daoListData &&
          daoListData.daos.map((dao: any) => (
            <div
              style={{ marginTop: '32px' }}
              onClick={() => updateSelectedDao(dao)}
              key={dao.name}
            >
              <DaoCard
                label={dao.name}
                aumValue={dao.executor.balance}
                numberOfProposals={dao.queue.nonce}
                daoId={dao.id}
              ></DaoCard>
            </div>
          ))}
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '46px',
          marginBottom: '80px',
        }}
      >
        {totalDaoCount !== visibleDaoList.length ||
        !(isLoadingRegistryData || isLoadingDaoList) ? (
          <ANButton
            label="Load More DAOs"
            type="secondary"
            height="46px"
            width="163px"
            color="#00C2FF"
            onClick={() => {
              fetchMoreDaos({
                variables: {
                  offset: visibleDaoList.length,
                },
              });
            }}
          ></ANButton>
        ) : null}
      </div>
    </ConsoleMainDiv>
  );
};
