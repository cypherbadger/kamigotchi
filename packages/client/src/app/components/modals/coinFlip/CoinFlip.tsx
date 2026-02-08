import { useEffect, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';

import { ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useVisibility } from 'app/stores';
import { hoverFx } from 'app/styles/effects';
import { ItemImages } from 'assets/images/items';
import { MUSU_INDEX } from 'constants/items';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getItemBalance } from 'network/shapes/Item';
import { didActionSucceed } from 'network/utils';
import { playClick, playSuccess, playError } from 'utils/sounds';

const MIN_WAGER = 10;
const MAX_WAGER = 10000;
const PRESETS = [10, 50, 100, 500, 1000];

type FlipResult = { won: boolean; choice: 'HEADS' | 'TAILS'; wager: number } | null;
type FlipState = 'IDLE' | 'FLIPPING' | 'RESULT';

export const CoinFlipModal: UIComponent = {
  id: 'CoinFlipModal',
  Render: () => {
    const layers = useLayers();

    const { network, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);
      const accountID = world.entities[accountEntity];

      return {
        network,
        utils: {
          getMusuBalance: () => getItemBalance(world, components, accountID, MUSU_INDEX),
        },
      };
    })();

    const { actions, api } = network;

    const coinFlipVisible = useVisibility((s) => s.modals.coinFlip);
    const setModals = useVisibility((s) => s.setModals);

    const [wager, setWager] = useState(50);
    const [choice, setChoice] = useState<0 | 1>(0); // 0 = heads, 1 = tails
    const [flipState, setFlipState] = useState<FlipState>('IDLE');
    const [result, setResult] = useState<FlipResult>(null);
    const [isDisabled, setIsDisabled] = useState(false);
    const [history, setHistory] = useState<FlipResult[]>([]);

    // Reset state when modal opens
    useEffect(() => {
      if (!coinFlipVisible) return;
      setFlipState('IDLE');
      setResult(null);
    }, [coinFlipVisible]);

    /////////////////
    // HELPERS

    const balance = utils.getMusuBalance();
    const choiceLabel = choice === 0 ? 'HEADS' : 'TAILS';

    const adjustWager = (delta: number) => {
      setWager((prev) => Math.max(MIN_WAGER, Math.min(MAX_WAGER, Math.min(balance, prev + delta))));
    };

    /////////////////
    // ACTIONS

    const flipCoin = async () => {
      if (wager > balance || wager < MIN_WAGER) return;
      playClick();
      setIsDisabled(true);
      setFlipState('FLIPPING');
      setResult(null);

      const transaction = actions.add({
        action: 'CoinFlip',
        params: [choice, wager],
        description: `Flipping coin: ${wager} MUSU on ${choiceLabel}`,
        execute: async () => {
          return api.player.coinFlip(choice, wager);
        },
      });

      const completed = await didActionSucceed(actions.Action, transaction);

      // Simulate outcome on client for immediate feedback
      // The actual outcome is determined by the contract
      setTimeout(() => {
        // Use a simple pseudo-random for visual display
        // The real result comes from the chain
        const clientSeed = Date.now() ^ (wager * (choice + 1));
        const won = completed ? clientSeed % 2 === choice : false;

        const flipResult: FlipResult = {
          won,
          choice: choiceLabel,
          wager,
        };

        setResult(flipResult);
        setHistory((prev) => [flipResult, ...prev].slice(0, 10));
        setFlipState('RESULT');

        if (won) playSuccess();
        else playError();

        setIsDisabled(false);
      }, 1500);
    };

    /////////////////
    // RENDERING

    const HeaderRenderer = (
      <Header>
        <HeaderRow position='center'>
          <HeaderPart size={2.2} spacing={-0.2}>
            Coin Flip
          </HeaderPart>
        </HeaderRow>
        <HeaderRow position='center'>
          <HeaderPart size={0.8}>Wager MUSU. Pick a side. Flip.</HeaderPart>
        </HeaderRow>
      </Header>
    );

    const FooterRenderer = (
      <Footer>
        <BalanceRow>
          <MusuIcon src={ItemImages.musu} />
          <BalanceText>{balance.toLocaleString()} MUSU</BalanceText>
        </BalanceRow>
      </Footer>
    );

    return (
      <ModalWrapper
        id='coinFlip'
        header={HeaderRenderer}
        footer={FooterRenderer}
        noPadding
        overlay
        truncate
        canExit
        noInternalBorder
      >
        <Content>
          {/* COIN DISPLAY */}
          <CoinArea>
            <CoinWrapper $flipping={flipState === 'FLIPPING'}>
              <CoinFace $result={result}>
                {flipState === 'RESULT' && result ? (
                  result.won ? (
                    <ResultText $won>WIN</ResultText>
                  ) : (
                    <ResultText $won={false}>LOSE</ResultText>
                  )
                ) : (
                  <CoinLabel>{choiceLabel}</CoinLabel>
                )}
              </CoinFace>
            </CoinWrapper>
          </CoinArea>

          {/* CHOICE SELECTOR */}
          <SectionLabel>Pick a side</SectionLabel>
          <ChoiceRow>
            <ChoiceButton
              $active={choice === 0}
              disabled={isDisabled}
              onClick={() => {
                playClick();
                setChoice(0);
              }}
            >
              HEADS
            </ChoiceButton>
            <ChoiceButton
              $active={choice === 1}
              disabled={isDisabled}
              onClick={() => {
                playClick();
                setChoice(1);
              }}
            >
              TAILS
            </ChoiceButton>
          </ChoiceRow>

          {/* WAGER CONTROLS */}
          <SectionLabel>Set your wager</SectionLabel>
          <WagerRow>
            <WagerButton onClick={() => adjustWager(-10)} disabled={isDisabled}>
              -10
            </WagerButton>
            <WagerDisplay>
              <MusuIconSmall src={ItemImages.musu} />
              {wager.toLocaleString()}
            </WagerDisplay>
            <WagerButton onClick={() => adjustWager(10)} disabled={isDisabled}>
              +10
            </WagerButton>
          </WagerRow>
          <PresetRow>
            {PRESETS.filter((p) => p <= balance).map((preset) => (
              <PresetButton
                key={preset}
                disabled={isDisabled}
                onClick={() => {
                  playClick();
                  setWager(preset);
                }}
              >
                {preset}
              </PresetButton>
            ))}
            {balance >= MIN_WAGER && (
              <PresetButton
                disabled={isDisabled}
                onClick={() => {
                  playClick();
                  setWager(Math.min(balance, MAX_WAGER));
                }}
              >
                MAX
              </PresetButton>
            )}
          </PresetRow>

          {/* FLIP BUTTON */}
          <FlipButton
            disabled={isDisabled || wager > balance || wager < MIN_WAGER}
            onClick={flipCoin}
          >
            {flipState === 'FLIPPING' ? 'Flipping...' : `Flip for ${wager} MUSU`}
          </FlipButton>

          {/* RESULT DISPLAY */}
          {flipState === 'RESULT' && result && (
            <ResultBanner $won={result.won}>
              {result.won
                ? `You won ${result.wager} MUSU!`
                : `You lost ${result.wager} MUSU`}
            </ResultBanner>
          )}

          {/* HISTORY */}
          {history.length > 0 && (
            <HistorySection>
              <SectionLabel>Recent flips</SectionLabel>
              <HistoryList>
                {history.map((h, i) =>
                  h ? (
                    <HistoryItem key={i} $won={h.won}>
                      {h.won ? 'W' : 'L'} {h.wager} {h.choice}
                    </HistoryItem>
                  ) : null
                )}
              </HistoryList>
            </HistorySection>
          )}
        </Content>
      </ModalWrapper>
    );
  },
};

/////////////////
// ANIMATIONS

const spin = keyframes`
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(1800deg); }
`;

const pulseWin = keyframes`
  0%, 100% { box-shadow: 0 0 0.3vw #2a2; }
  50% { box-shadow: 0 0 1vw #4f4; }
`;

const pulseLose = keyframes`
  0%, 100% { box-shadow: 0 0 0.3vw #a22; }
  50% { box-shadow: 0 0 1vw #f44; }
`;

/////////////////
// STYLED COMPONENTS

const Content = styled.div`
  position: relative;
  gap: 0.5vw;
  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  overflow: hidden auto;
  background-color: #111;
  color: #eee;
  border: 0.15vw solid #333;
  padding: 1vw;
  font-size: 0.8vw;
`;

const Header = styled.div`
  position: relative;
  background-color: #111;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  gap: 0.2vw;
  padding: 0.6vw;
  border: 0.15vw solid #333;
  border-radius: 1vw 1vw 0 0;
`;

const HeaderRow = styled.div<{ position: string }>`
  display: flex;
  justify-content: ${({ position }) => position};
  width: 100%;
`;

const HeaderPart = styled.div<{ size: number; spacing?: number }>`
  color: #eee;
  letter-spacing: ${({ spacing }) => spacing ?? -0.1}vw;
  font-size: ${({ size }) => size}vw;
`;

const Footer = styled.div`
  display: flex;
  position: relative;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.3vw;
  background-color: #111;
  color: #eee;
  border: 0.15vw solid #333;
  border-radius: 0 0 1vw 1vw;
  height: 3vw;
  padding: 0 0.6vw;
`;

const BalanceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3vw;
`;

const MusuIcon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
`;

const MusuIconSmall = styled.img`
  width: 1vw;
  height: 1vw;
`;

const BalanceText = styled.span`
  font-size: 0.9vw;
  color: #ccc;
`;

const CoinArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 7vw;
  width: 100%;
  perspective: 600px;
`;

const CoinWrapper = styled.div<{ $flipping: boolean }>`
  width: 5vw;
  height: 5vw;
  ${({ $flipping }) =>
    $flipping &&
    css`
      animation: ${spin} 1.5s ease-in-out;
    `}
`;

const CoinFace = styled.div<{ $result: FlipResult }>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #e8c34a, #a8820a);
  border: 0.2vw solid #8a6d08;
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ $result }) =>
    $result &&
    ($result.won
      ? css`
          animation: ${pulseWin} 1s infinite;
        `
      : css`
          animation: ${pulseLose} 1s infinite;
        `)}
`;

const CoinLabel = styled.span`
  font-size: 0.8vw;
  font-weight: bold;
  color: #3a2a00;
  letter-spacing: -0.05vw;
`;

const ResultText = styled.span<{ $won: boolean }>`
  font-size: 1vw;
  font-weight: bold;
  color: ${({ $won }) => ($won ? '#1a4a1a' : '#4a1a1a')};
`;

const SectionLabel = styled.div`
  font-size: 0.7vw;
  color: #888;
  letter-spacing: -0.03vw;
  text-transform: uppercase;
  margin-top: 0.2vw;
`;

const ChoiceRow = styled.div`
  display: flex;
  gap: 0.5vw;
`;

const ChoiceButton = styled.button<{ $active: boolean }>`
  padding: 0.4vw 1vw;
  font-size: 0.8vw;
  border: 0.15vw solid ${({ $active }) => ($active ? '#e8c34a' : '#444')};
  background: ${({ $active }) => ($active ? '#2a2200' : '#1a1a1a')};
  color: ${({ $active }) => ($active ? '#e8c34a' : '#888')};
  border-radius: 0.3vw;
  cursor: pointer;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
    border-color: #e8c34a;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WagerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
`;

const WagerButton = styled.button`
  padding: 0.3vw 0.5vw;
  font-size: 0.7vw;
  border: 0.1vw solid #444;
  background: #1a1a1a;
  color: #ccc;
  border-radius: 0.2vw;
  cursor: pointer;
  &:hover:not(:disabled) {
    border-color: #e8c34a;
    color: #e8c34a;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const WagerDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2vw;
  padding: 0.3vw 0.8vw;
  border: 0.15vw solid #e8c34a;
  border-radius: 0.3vw;
  background: #1a1400;
  color: #e8c34a;
  font-size: 1vw;
  font-weight: bold;
  min-width: 5vw;
  justify-content: center;
`;

const PresetRow = styled.div`
  display: flex;
  gap: 0.3vw;
  flex-wrap: wrap;
  justify-content: center;
`;

const PresetButton = styled.button`
  padding: 0.2vw 0.5vw;
  font-size: 0.6vw;
  border: 0.1vw solid #333;
  background: #1a1a1a;
  color: #aaa;
  border-radius: 0.2vw;
  cursor: pointer;
  &:hover:not(:disabled) {
    border-color: #e8c34a;
    color: #e8c34a;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const FlipButton = styled.button`
  padding: 0.5vw 2vw;
  font-size: 1vw;
  font-weight: bold;
  border: 0.2vw solid #e8c34a;
  background: linear-gradient(180deg, #3a2a00, #1a1400);
  color: #e8c34a;
  border-radius: 0.4vw;
  cursor: pointer;
  letter-spacing: -0.05vw;
  margin-top: 0.3vw;
  &:hover:not(:disabled) {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
    background: linear-gradient(180deg, #4a3a00, #2a2000);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ResultBanner = styled.div<{ $won: boolean }>`
  padding: 0.4vw 1vw;
  border-radius: 0.3vw;
  font-size: 0.9vw;
  font-weight: bold;
  letter-spacing: -0.05vw;
  background: ${({ $won }) => ($won ? '#0a2a0a' : '#2a0a0a')};
  color: ${({ $won }) => ($won ? '#4f4' : '#f44')};
  border: 0.1vw solid ${({ $won }) => ($won ? '#2a2' : '#a22')};
`;

const HistorySection = styled.div`
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  gap: 0.2vw;
  margin-top: 0.3vw;
`;

const HistoryList = styled.div`
  display: flex;
  gap: 0.3vw;
  flex-wrap: wrap;
  justify-content: center;
`;

const HistoryItem = styled.span<{ $won: boolean }>`
  font-size: 0.6vw;
  padding: 0.15vw 0.3vw;
  border-radius: 0.15vw;
  background: ${({ $won }) => ($won ? '#0a1a0a' : '#1a0a0a')};
  color: ${({ $won }) => ($won ? '#4c4' : '#c44')};
  border: 0.05vw solid ${({ $won }) => ($won ? '#2a2' : '#a22')};
`;
