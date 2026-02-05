import { audioManager } from 'audio/AudioManager';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { TriggerIcons } from 'assets/images/icons/triggers';
import { playClick } from 'utils/sounds';

// TODO: formally define the settings struct at some central roomIndex
// TODO: smoother volume slider (atm clunky bc relying directly on localstorage updates)
export const Volume = () => {
  const [settings, setSettings] = useLocalStorage('settings', {
    volume: { fx: 0.5, bgm: 0.5 },
    audioQuality: 'low',
  });
  const [bgmVolume, setBgmVolume] = useState(settings.volume.bgm);
  const [fxVolume, setFxVolume] = useState(settings.volume.fx);
  const [audioQuality, setAudioQuality] = useState<'low' | 'high'>(
    (settings as any).audioQuality || 'low'
  );

  useEffect(() => {
    setSettings({ ...settings, volume: { bgm: bgmVolume, fx: fxVolume }, audioQuality });
    audioManager.setBusVolume('bgm', bgmVolume);
    audioManager.setBusVolume('fx', fxVolume);
  }, [bgmVolume, fxVolume, audioQuality]);

  useEffect(() => {
    audioManager.setQuality(audioQuality);
  }, [audioQuality]);

  const toggleVolume = (type: string) => {
    let volume = type === 'fx' ? fxVolume : bgmVolume;
    let setVolume = type === 'fx' ? setFxVolume : setBgmVolume;
    setVolume(volume === 0 ? 0.5 : 0);
    playClick();
  };

  const MusicRow = () => {
    const icon = bgmVolume == 0 ? TriggerIcons.soundOff : TriggerIcons.soundOn;
    return (
      <Row>
        <Text style={{ flexGrow: 2 }}>Music</Text>
        <RangeInput
          type='range'
          min='0'
          max='1'
          step='0.1'
          value={bgmVolume}
          onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
        />
        <Icon src={icon} onClick={() => toggleVolume('bgm')} />
      </Row>
    );
  };

  const SoundEffectsRow = () => (
    <Row>
      <Text style={{ flexGrow: 2 }}>Sound FX</Text>
      <RangeInput
        type='range'
        min='0'
        max='1'
        step='0.1'
        value={fxVolume}
        onChange={(e) => setFxVolume(parseFloat(e.target.value))}
      />
      <Icon
        src={fxVolume == 0 ? TriggerIcons.soundOff : TriggerIcons.soundOn}
        onClick={() => toggleVolume('fx')}
      />
    </Row>
  );

  return (
    <Container>
      <Section>
        <Title>Volume</Title>
        {MusicRow()}
        {SoundEffectsRow()}
      </Section>
      <Section>
        <Title>Audio Quality</Title>
        <Row>
          <Text style={{ flexGrow: 2 }}>Prefer faster downloads</Text>
          <Select
            value={audioQuality}
            onChange={(e) => {
              const q = e.target.value as 'low' | 'high';
              setAudioQuality(q);
            }}
          >
            <option value='low'>Fast (96 kbps)</option>
            <option value='high'>Standard (128 kbps)</option>
          </Select>
        </Row>
      </Section>
    </Container>
  );
};

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: 0.6em;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 1em;
  margin-bottom: 1em;
`;

const Row = styled.div`
  padding-left: 0.7em;
  padding-right: 0.7em;
  padding-bottom: 0.3em;

  display: flex;
  align-items: center;
  gap: 0.75em;
  width: 100%;
  box-sizing: border-box;
  flex-wrap: wrap;
  row-gap: 0.375em;
`;

const Icon = styled.img`
  width: 3em;
  height: 3em;
  margin: 0em 1em;
  cursor: pointer;
`;

const Text = styled.p`
  color: #333;
  font-size: 0.8em;
  text-align: left;
  min-width: 0;
  flex: 1 1 8.75em;
`;

// how df do you style this thing
const RangeInput = styled.input`
  padding: 0;
  cursor: pointer;
  flex: 1 1 8.75em;
  min-width: 7.5em;
`;
const Select = styled.select`
  box-sizing: border-box;
  padding: 0.375em 0.75em;
  flex: 1 1 12.5em;
  min-width: 10em;
  width: 100%;
  border-radius: 6em;
  border: 0.0625em solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
  color: white;
`;
