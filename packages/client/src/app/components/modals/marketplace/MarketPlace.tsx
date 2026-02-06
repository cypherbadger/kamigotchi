import { useState } from 'react';

import { getAccountKamis as _getAccountKamis } from 'app/cache/account';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import VendIcon from 'assets/images/rooms/18_cave-crossroads/vend.png';
import { queryAccountFromEmbedded } from 'network/shapes/Account';

import { Bids } from './Bids';
import { CreateOrder } from './CreateOrder';
import { Listings } from './Listings';
import { MyOrders } from './MyOrders';
import { Tabs } from './tabs/Tabs';

export const MarketPlaceModal: UIComponent = {
  id: 'MarketPlaceModal',
  Render: () => {
    const [tab, setTab] = useState('listings');
    const [showCreateOrder, setShowCreateOrder] = useState(false);

    const toggleCreateOrder = () => setShowCreateOrder((prev) => !prev);

    const { utils } = (() => {
      const { network } = useLayers();
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);

      return {
        utils: {
          getAccountKamis: () => _getAccountKamis(world, components, accountEntity),
        },
      };
    })();

    return (
      <ModalWrapper
        id='marketplace'
        header={<ModalHeader title='Marketplace' icon={VendIcon} />}
        canExit
      >
        <Tabs tab={tab} setTab={setTab} onCreateOrder={toggleCreateOrder} />
        <Listings isVisible={tab === 'listings'} />
        <Bids isVisible={tab === 'bids'} />
        <MyOrders isVisible={tab === 'myOrders'} />
        <CreateOrder isVisible={showCreateOrder} utils={utils} />
      </ModalWrapper>
    );
  },
};
