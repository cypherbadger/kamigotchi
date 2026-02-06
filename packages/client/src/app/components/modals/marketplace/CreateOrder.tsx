import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { isResting } from 'app/cache/kami';
import { IconButton } from 'app/components/library';
import { DropdownToggle } from 'app/components/library/buttons/DropdownToggle';
import { MenuIcons } from 'assets/images/icons/menu';
import { TokenIcons } from 'assets/images/tokens';
import { Kami } from 'network/shapes/Kami';

type OrderType = 'Sell' | 'Buy';
const expirationOptions = [
  { value: '1h', label: '1 Hour' },
  { value: '3h', label: '3 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: 'never', label: 'Never' },
];

export const CreateOrder = ({
  isVisible,
  utils,
}: {
  isVisible: boolean;
  utils: {
    getAccountKamis: () => Kami[];
  };
}) => {
  const [orderType, setOrderType] = useState<OrderType>('Sell');
  const [price, setPrice] = useState('');
  const [expiration, setExpiration] = useState('1h');

  const restingKamis = useMemo(() => {
    return utils.getAccountKamis().filter((kami) => isResting(kami));
  }, [utils]);

  const kamiOptions = useMemo(
    () => restingKamis.map((k) => ({ text: k.name, object: k, img: k.image })),
    [restingKamis]
  );

  const handleKamiSelect = (_selected: any[]) => {};

  const handleCreate = () => {};
  const handleClear = () => {};

  const toggleOrderType = () => {
    if (orderType === 'Sell') setOrderType('Buy');
    if (orderType === 'Buy') setOrderType('Sell');
  };

  return (
    <Container isVisible={isVisible}>
      <Header>Create order</Header>
      <Body>
        <Row style={{ alignItems: `center` }}>
          <Label>I want to:</Label>
          <IconButton text={`< ${orderType} >`} onClick={toggleOrderType} />
        </Row>
      </Body>
      {orderType === 'Sell' && (
        <>
          <Body>
            <Row>
              <Section>
                <SubHeader>Kami</SubHeader>
                <DropdownToggle
                  limit={12}
                  options={[kamiOptions]}
                  onClick={[handleKamiSelect]}
                  button={{
                    images: [MenuIcons.kami],
                    tooltips: ['Select Kami'],
                  }}
                  radius={0.6}
                />
              </Section>
              <Section>
                <SubHeader>Price</SubHeader>
                <Price>
                  <PriceInput
                    type='text'
                    inputMode='decimal'
                    placeholder='0'
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value;
                      // TODO: remove \.? if we dont want decimals
                      if (val === '' || /^\d*\.?\d*$/.test(val)) setPrice(val);
                    }}
                  />
                  <EthIcon src={TokenIcons.eth} alt='ETH' />
                </Price>
              </Section>
            </Row>
          </Body>
          <SubHeader>Expiration</SubHeader>
          <Body>
            <ExpirationRow>
              {expirationOptions.map((opt) => (
                <RadioLabel key={opt.value}>
                  <input
                    type='radio'
                    name='expiration'
                    value={opt.value}
                    checked={expiration === opt.value}
                    onChange={() => setExpiration(opt.value)}
                  />
                  {opt.label}
                </RadioLabel>
              ))}
            </ExpirationRow>
          </Body>
        </>
      )}
      <Actions>
        <IconButton text='Create' onClick={handleCreate} />
        <IconButton text='Clear' onClick={handleClear} />
      </Actions>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 0 0 45%;
  overflow: auto;
  border-top: 0.15vw solid black;
  width: 100%;
`;

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  gap: 0.6vw;
`;

const Header = styled.div`
  background-color: rgb(221, 221, 221);
  padding: 0.8vw;
  font-size: 1.2vw;
  text-align: left;
`;
const SubHeader = styled.div`
  border-bottom: 0.15vw solid black;
  padding: 0.8vw;
  font-size: 1.1vw;
  text-align: left;
`;
const Body = styled.div`
  padding: 0.3vw 0 0 0.3vw;
  gap: 0.6vw;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Price = styled.div`
  display: flex;
  align-items: center;
`;

const Row = styled.div`
  width: 100%;
  gap: 0.6vw;
  display: flex;
  flex-flow: row nowrap;
`;

const Label = styled.span`
  font-size: 1vw;
`;

const PriceInput = styled.input`
  font-size: 1vw;
  width: 6vw;
  height: 2.5vw;
  padding: 0.3vw 0.4vw;
  border: 0.15vw solid black;
  outline: none;
  background: white;
`;

const EthIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;

const ExpirationRow = styled.div`
  margin-top: 0.3vw;
  display: flex;
  flex-flow: row nowrap;
  gap: 1.2vw;
  align-items: center;
`;

const RadioLabel = styled.label`
  font-size: 1vw;
  display: flex;
  align-items: center;
  gap: 0.2vw;
  cursor: pointer;

  input[type='radio'] {
    accent-color: rgb(203, 186, 61);
    cursor: pointer;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  gap: 0.6vw;
  padding: 0.6vw;
  margin-top: auto;
`;
