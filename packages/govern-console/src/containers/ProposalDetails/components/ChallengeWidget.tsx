/* eslint-disable */
import React, { memo, useEffect, useMemo, useState } from 'react';
import { ANButton } from 'components/Button/ANButton';
import { InputField } from 'components/InputFields/InputField';
import { PROPOSAL_STATES } from 'utils/states';
import { Link } from 'react-router-dom';

import {
  InfoKeyDiv,
  InfoValueDivInline,
  InfoValueDivBlock,
} from '../ProposalDetails';
import { Widget, WidgetRow, InfoWrapper, TitleText } from './SharedStyles';

import { getFormattedDate} from 'utils/date';
import { getTruncatedAccountAddress } from 'utils/account'
import { getIpfsCidFromUri } from 'utils/ipfs'

const ChallengeWidget: React.FC<any> = ({
  containerEventChallenge,
  currentState,
  setChallengeReason,
  onChallengeProposal,
}) => {
  const [isExpanded, updateIsExpanded] = React.useState<boolean>(false);
  const bla = (showing: any) => {
    const isIPFS = getIpfsCidFromUri(showing);
    if(isIPFS) {
      
    }
  }
  if (containerEventChallenge) {
    return (
      <Widget>
        <WidgetRow>
          <TitleText>Challenge Details</TitleText>
        </WidgetRow>
        <InfoWrapper>
          <InfoKeyDiv>Challenged At</InfoKeyDiv>
          <InfoValueDivInline id="challenged-date__value">
            {getFormattedDate(containerEventChallenge.createdAt)}
          </InfoValueDivInline>
        </InfoWrapper>
        <InfoWrapper>
          <InfoKeyDiv>Challenger</InfoKeyDiv>
          <InfoValueDivInline id="challenger__value">
            {getTruncatedAccountAddress(containerEventChallenge.challenger)}
          </InfoValueDivInline>
        </InfoWrapper>
        <InfoKeyDiv>Challenge Reason</InfoKeyDiv>
        <InfoValueDivBlock
          maxlines={isExpanded ? undefined : 4}
          style={{
            padding: 0,
            WebkitBoxOrient: 'vertical',
            display: '-webkit-box',
            marginTop: 0,
          }}
        >
          
          {/* getIpfsCidFromUri(containerEventChallenge.reason) 
          ?
            <Link
                to={""}
                target="_blank"
                rel="noreferrer noopener"
              >
                DAO Settings
            </Link> */}
            
          
        </InfoValueDivBlock>
      </Widget>
    );
  }

  if (currentState !== PROPOSAL_STATES.SCHEDULED) {
    return <></>;
  }

  return (
    <Widget>
      <WidgetRow
        style={{
          fontSize: '18px',
          color: '#7483B3',
        }}
        marginBottom="9px"
      >
        Challenge Reason
      </WidgetRow>
      <WidgetRow marginBottom="9px">
        <InputField
          onInputChange={(value) => {
            setChallengeReason(value);
          }}
          label={''}
          placeholder={''}
          height={'46px'}
          width={'372px'}
          // value={challengeReason.current}
        />
      </WidgetRow>
      <WidgetRow marginBottom="9px">
        <ANButton
          buttonType="primary"
          label="Challenge"
          height="45px"
          width="372px"
          style={{ margin: 'auto' }}
          onClick={() => onChallengeProposal()}
        />
      </WidgetRow>
    </Widget>
  );
};

export default memo(ChallengeWidget);
