import React from 'react';
import { CustomTransaction, CustomTransactionStatus } from 'utils/types';
import { ANCircularProgressWithCaption } from 'components/CircularProgress/ANCircularProgressWithCaption';
import { CiruclarProgressStatus } from 'utils/types';
import { styled } from '@material-ui/core/styles';

export interface TransactionListProps {
  transactions: CustomTransaction[];
}

const TransactionListWrapper = styled('ul')({
  paddingInlineStart: '30px',
  listStyle: 'none',
});
const TransactionListItem = styled('li')({
  padding: 0,
});

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const getListItem = (transaction: CustomTransaction) => {
    switch (transaction.status) {
      case CustomTransactionStatus.Pending:
        return (
          <ANCircularProgressWithCaption
            caption={transaction.message} // TODO: pending
            state={CiruclarProgressStatus.Disabled}
          />
        );
      case CustomTransactionStatus.InProgress:
        return (
          <ANCircularProgressWithCaption
            caption={transaction.message} // TODO: in progress
            state={CiruclarProgressStatus.InProgress}
          />
        );
      case CustomTransactionStatus.Successful:
        return (
          <ANCircularProgressWithCaption
            caption={transaction.message} // TODO: successfull
            state={CiruclarProgressStatus.Done}
          />
        );
      case CustomTransactionStatus.Failed:
        return (
          <ANCircularProgressWithCaption
            caption={transaction.message} // TODO: failed
            state={CiruclarProgressStatus.Failed}
          />
        );
    }
  };
  return (
    <>
      <TransactionListWrapper>
        {transactions.map((transaction) => {
          return (
            <TransactionListItem key={transaction.message}>
              {getListItem(transaction)}
            </TransactionListItem>
          );
        })}
      </TransactionListWrapper>
    </>
  );
};

export default React.memo(TransactionList);
