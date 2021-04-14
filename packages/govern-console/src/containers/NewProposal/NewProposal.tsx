import React, { useState, useRef, memo, useCallback } from 'react';
import { ANButton } from '../../components/Button/ANButton';
import { useTheme, styled, Theme } from '@material-ui/core/styles';
import useStyles from '../../ReusableStyles';
import backButtonIcon from '../../images/back-btn.svg';
import Typography from '@material-ui/core/Typography';
import { HelpButton } from '../../components/HelpButton/HelpButton';
import TextArea from '../../components/TextArea/TextArea';
import Paper from '@material-ui/core/Paper';
import { NewActionModal } from '../../components/Modal/NewActionModal';
import { AddActionsModal } from '../../components/Modal/AddActionsModal';
import { InputField } from '../../components/InputFields/InputField';
export interface NewProposalProps {
  /**
   * All the details of DAO
   */
  daoDetails?: any;
  /**
   * callback for click on schedule
   */
  onSchedule?: any;
}

export interface AddedActionsProps {
  /**
   * Added actions
   */
  selectedActions?: any;
}

const SubTitle = styled(Typography)({
  fontFamily: 'Manrope',
  fontStyle: 'normal',
  fontWeight: 'normal',
  fontSize: 18,
  lineHeight: '25px',
  color: '#7483AB',
});

const TextBlack = styled(Typography)({
  fontFamily: 'Manrope',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: 18,
  lineHeight: '25px',
  color: '0A0B0B',
});

const ContractAddressText = styled(Typography)({
  fontFamily: 'Manrope',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: 18,
  lineHeight: '25px',
  color: '0A0B0B',
});

const AddedActions: React.FC<AddedActionsProps> = ({
  selectedActions,
  ...props
}) => {
  const actionDivStyle = {
    width: '862px',
    border: '2px solid #E2ECF5',
    borderRadius: '10px',
    paddingLeft: '24px',
    paddingRight: '24px',
    paddingBottom: '22px',
    paddingTop: '22px',
    marginTop: '18px',
  };

  const actionNameDivStyle = {
    paddingBottom: '21px',
    borderBottom: '2px solid #E2ECF5',
  };

  return selectedActions.map((action: any) => (
    <div style={{ marginTop: '24px' }} key={action.name}>
      <div>
        <SubTitle>Contract Address</SubTitle>
        <ContractAddressText>{action.contractAddress}</ContractAddressText>
      </div>
      <div style={actionDivStyle}>
        <div style={actionNameDivStyle}>
          <TextBlack>{action.name}</TextBlack>
        </div>
        {action.item.inputs.map((input: any) => (
          <div key={input.name}>
            <div style={{ marginTop: '20px' }}>
              <SubTitle>{input.name}</SubTitle>
            </div>
            <div style={{ marginTop: '20px' }}>
              <InputField
                label=""
                onInputChange={() => {
                  console.log('click');
                }}
                height="46px"
                width="814px"
                placeholder={input.name}
              ></InputField>
            </div>
          </div>
        ))}
      </div>
    </div>
  ));
};

const NewProposal: React.FC<NewProposalProps> = ({
  daoDetails,
  onSchedule,
}) => {
  const theme = useTheme();
  const classes = useStyles();
  const justification = useRef();
  // const [isAddingActions, updateIsAddingActions] = useState(false);
  const [selectedActions, updateSelectedOptions] = useState([]);
  // const [modalStyle] = React.useState(getModalStyle);
  const [isInputModalOpen, setInputModalOpen] = useState(false);
  const [isActionModalOpen, setActionModalOpen] = useState(false);
  const abiFunctions = useRef([]);

  const handleInputModalOpen = () => {
    setInputModalOpen(true);
  };

  const handleInputModalClose = () => {
    setInputModalOpen(false);
  };

  const handleActionModalOpen = () => {
    setActionModalOpen(true);
  };

  const handleActionModalClose = () => {
    setActionModalOpen(false);
  };

  const onAddNewAction = (action: any) => {
    const newActions = [...selectedActions, action];
    updateSelectedOptions(newActions);
  };
  // const onScheduleProposal = () => {};

  const WrapperDiv = styled(Paper)({
    width: '100%',
    background: theme.custom.white,
    height: 'auto',
    padding: '50px 273px 76px 273px',
    // display: 'block',
    boxSizing: 'border-box',
    boxShadow: 'none',
    // flexDirection: 'column',
  });
  const BackButton = styled('div')({
    height: 25,
    width: 62,
    cursor: 'pointer',
    position: 'relative',
    left: -6,
  });
  const Title = styled(Typography)({
    fontFamily: 'Manrope',
    fontStyle: 'normal',
    fontWeight: 600,
    fontSize: 28,
    lineHeight: '38px',
    color: '#20232C',
    marginTop: 17,
    height: 50,
    display: 'block',
  });
  const JustificationTextArea = styled(TextArea)({
    background: '#FFFFFF',
    border: '2px solid #EFF1F7',
    boxSizing: 'border-box',
    boxShadow: 'inset 0px 2px 3px 0px rgba(180, 193, 228, 0.35)',
    borderRadius: '8px',
    width: '100%',
    height: 104,
    padding: '11px 21px',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '25px',
    letterSpacing: '0em',
    // border: '0 !important',
    '& .MuiInputBase-root': {
      border: 0,
      width: '100%',
      input: {
        width: '100%',
      },
    },
    '& .MuiInput-underline:after': {
      border: 0,
    },
    '& .MuiInput-underline:before': {
      border: 0,
    },
    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
      border: 0,
    },
  });
  const isProposalValid = () => {
    if (justification.current === '') return false;
    if (selectedActions.length === 0) return false;
    return true;
  };

  const onGenerateActionsFromAbi = async (
    contractAddress: string,
    abi: any,
  ) => {
    console.log(contractAddress, abi);
    const functions = [];
    await abi.forEach((item: any) => {
      const { name, type, stateMutability } = item;
      if (
        type === 'function' &&
        stateMutability !== 'view' &&
        stateMutability !== 'pure'
      ) {
        const data = {
          name,
          type,
          item,
          contractAddress,
        };
        functions.push(data);
      }
    });

    abiFunctions.current = functions;
    console.log(abiFunctions);
    handleInputModalClose();
    handleActionModalOpen();
  };

  return (
    <>
      <WrapperDiv>
        <BackButton>
          <img src={backButtonIcon} />
        </BackButton>
        <Title>New Proposal</Title>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            marginBottom: '10px',
          }}
        >
          <div>
            <SubTitle>Justification</SubTitle>{' '}
          </div>
          <div style={{ marginLeft: '10px' }}>{<HelpButton helpText="" />}</div>
        </div>
        <JustificationTextArea
          // ref={}
          value={justification.current}
          onChange={useCallback((event) => {
            justification.current = event.target.value;
          }, [])}
          placeholder={'Enter Justification '}
        ></JustificationTextArea>
        <Title>Actions</Title>
        {selectedActions.length === 0 ? (
          <SubTitle>No actions defined Yet</SubTitle>
        ) : (
          <div>
            <AddedActions selectedActions={selectedActions} />
          </div>
        )}
        <br />
        <ANButton
          label="Add new action"
          // width={155}
          // height={45}
          type="secondary"
          color="#00C2FF"
          style={{ marginTop: 40 }}
          onClick={handleInputModalOpen}
        />
        <br />
        <ANButton
          label="Schedule/Submit"
          // width={178}
          // height={45}
          type="primary"
          // color="#00C2FF"
          style={{ marginTop: 16 }}
          disabled={!isProposalValid()}
        />
        <NewActionModal
          onCloseModal={handleInputModalClose}
          onGenerate={onGenerateActionsFromAbi}
          open={isInputModalOpen}
        ></NewActionModal>
        <AddActionsModal
          onCloseModal={handleActionModalClose}
          open={isActionModalOpen}
          onAddAction={onAddNewAction}
          actions={abiFunctions.current}
        ></AddActionsModal>
      </WrapperDiv>
    </>
  );
};

export default memo(NewProposal);
