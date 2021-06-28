import React, { memo } from 'react';
import {
  TextInput,
  Card,
  Box,
  useTheme,
  useLayout,
  ButtonIcon,
  IconUp,
  IconDown,
  IconCross,
  GU,
} from '@aragon/ui';
import { ActionItem } from 'utils/types';
import { Controller, useFormContext } from 'react-hook-form';
import { getTruncatedAccountAddress } from 'utils/account';

type ActionListProps = {
  actions: Array<ActionItem & { id: string }>;
  swap: (indexA: number, indexB: number) => void;
  remove: (index: number) => void;
};

type ActionHeaderProps = {
  contractAddress: string;
  index: number;
  count: number;
  swap: (indexA: number, indexB: number) => void;
  remove: (index: number) => void;
};

const ActionHeader: React.FC<ActionHeaderProps> = memo(function ActionHeader({
  contractAddress,
  index,
  count,
  swap,
  remove,
}) {
  const theme = useTheme();
  const { layoutName } = useLayout();

  return (
    <div
      style={{
        display: 'grid',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        gridAutoFlow: `${layoutName === 'small' ? 'row' : 'column'}`,
        gridTemplateColumns: `${layoutName === 'small' ? '1fr' : 'auto 100px'}`,
      }}
    >
      <div>
        Contract:{' '}
        <span>
          {layoutName === 'small' ? getTruncatedAccountAddress(contractAddress) : contractAddress}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          justifyContent: `${layoutName === 'small' ? 'space-between' : 'end'}`,
        }}
      >
        <div>
          <ButtonIcon label="Up" onClick={index > 0 ? () => swap(index, index - 1) : undefined}>
            <IconUp color={theme.primary} />
          </ButtonIcon>
          <ButtonIcon
            label="Down"
            onClick={index < count - 1 ? () => swap(index, index + 1) : undefined}
          >
            <IconDown color={theme.primary} />
          </ButtonIcon>
        </div>
        <div>
          <ButtonIcon label="Remove" onClick={() => remove(index)}>
            <IconCross color={theme.red} />
          </ButtonIcon>
        </div>
      </div>
    </div>
  );
});

const ActionList: React.FC<ActionListProps> = ({ actions, swap, remove }) => {
  const { control } = useFormContext();

  if (actions && actions.length === 0) {
    return (
      <Card width="auto" height={`${15 * GU}px`}>
        No action yet.
      </Card>
    );
  }

  return (
    <div>
      {actions.map((action, index: number) => (
        <Box
          css={`
            & > h1 {
              height: auto !important;
            }
          `}
          key={action.id}
          heading={
            <ActionHeader
              contractAddress={action.contractAddress}
              index={index}
              count={actions.length}
              remove={remove}
              swap={swap}
            />
          }
        >
          <Box heading={action.name}>
            {action.inputs.map((input: any, num: number) => {
              const element = (
                <Controller
                  key={`actions.${index}.inputs.${num}.value`}
                  name={`actions.${index}.inputs.${num}.value` as const}
                  control={control}
                  defaultValue={input.value}
                  rules={{
                    required: 'This is required.',
                  }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <TextInput
                      wide
                      value={value}
                      onChange={onChange}
                      subtitle={input.name}
                      placeholder={input.type}
                      status={error ? 'error' : 'normal'}
                      error={error ? error.message : null}
                    />
                  )}
                />
              );
              return element;
            })}
          </Box>
        </Box>
      ))}
    </div>
  );
};

export default memo(ActionList);
