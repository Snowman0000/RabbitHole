import './App.css';
import { useState, useEffect, useRef, createRef } from 'react';
import { ethers } from 'ethers';
import rabbit from './artifacts/contracts/RabbitHole.sol/RabbitHole.json';
import { useSDK } from "@metamask/sdk-react";
import {
  Row,
  Col,
  Table,
  Button,
  Image,
  InputNumber,
  Spin,
  Avatar
} from 'antd';
import { render } from '@testing-library/react';

function App() {
  const [account, setAccount] = useState();
  const { sdk, connected, connecting, provider, chainId } = useSDK();
  const [speed, setSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [idealSpeed, setIdealSpeed] = useState(1);
  const [state, setState] = useState('ready');
  const [phase, setPhase] = useState('Default');

  const ColorList = ['#f56a00', '#7265e6', '#ffbf00', '#87d068'];
  
  const [players, setPlayers] = useState([
    {key: '1', id: 'Player 1', player: 'Bot 1', src: 'https://i.ibb.co/SN7JyMF/sheeepy.png', fuel: 50, speed: 5, status: 'ready'},
    {key: '2', id: 'Player 2', player: 'Bot 2', src: 'https://i.ibb.co/vXGDsDD/blacksheep.png', fuel: 50, speed: 5, status: 'ready'},
    {key: '3', id: 'Player 3', player: 'Player', src: 'https://i.ibb.co/SN7JyMF/sheeepy.png', fuel: 50, speed: 5, status: 'ready'}
  ])

  const columns = [
    {
      title: 'Player',
      dataIndex: 'player',
      key: 'player',
    },
    {
      title: 'Speed',
      dataIndex: 'speed',
      key: 'speed',
    },
    {
      title: 'Fuel',
      dataIndex: 'fuel',
      key: 'fuel',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (item) => (
        <>
          {item == 'ready' && <Avatar style={{ backgroundColor: ColorList[2], verticalAlign: 'middle' }} size="small" />}
          {item == 'success' && <Avatar style={{ backgroundColor: ColorList[3], verticalAlign: 'middle' }} size="small" />}
          {item == 'failed' && <Avatar style={{ backgroundColor: ColorList[0], verticalAlign: 'middle' }} size="small" />}
        </>
      )
    }
  ];

  const connect = async () => {
    try {
        const accounts = await sdk?.connect();
        setAccount(accounts?.[0]);
    } catch (err) {
        console.warn("failed to connect..", err);
    }
  };

  const handleChangeSpeed = async () => {
    if (state == 'start') {
      return;
    }
    setIsLoading(true);
    const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/a27749044b104f099370a5b6c5ea2914");
    const signer = new ethers.Wallet("0x244ac182355e773cef95391540ae9f73970798d17dc8330a3a03237e3e37ca7c", provider);
    const contract = new ethers.Contract("0x6eDc7ECCcA03c55872ee286cB729c410ef325Fd7", rabbit.abi, signer);

    const tx = await contract.setPlayerSpeed(speed * 100);
    await tx.wait();

    const datas = await contract.getPlayers();
    setIsLoading(false);
    let data = [
      {fuel: parseInt(datas[0][0][1]), speed: parseInt(datas[0][0][2])},
      {fuel: parseInt(datas[0][1][1]), speed: parseInt(datas[0][1][2])},
      {fuel: parseInt(datas[0][2][1]), speed: parseInt(datas[0][2][2])},
    ];
    
    setIdealSpeed((parseInt(datas[1]) / 100).toFixed(2));

    setPlayers(players.map((item, index) => {
      return {
        ...item,
        fuel: data[index].fuel,
        speed: (data[index].speed / 100).toFixed(2)
      }
    }));
  }

  const handleStartEvent = () => {
    setState('start');
    setPhase('CloseTunnel'); // Close tunnel: Head moves to swallow everything. Open tunnel: cars get out
    setTimeout(() => setPhase('OpenTunnel'), 5000); 
    setTimeout(() => setPhase('Reset'), 16000);
    // setState('ready');
  }

  useEffect(() => {
    let intervalId;
    if (phase == 'OpenTunnel') {
      intervalId = setTimeout(() => {
        setPlayers(players.map(item => {
          return {
            ...item,
            fuel: (item.fuel - parseFloat(item.speed) * item.fuel / parseFloat(idealSpeed)).toFixed(2)
          }
        }));
      }, 9000);
    }
    if (phase == 'Reset') {
      setPlayers(players.map(item => {
        return {
          ...item,
          status: parseFloat(item.fuel) >= 0 ? 'success' : 'failed'
        }
      }))
    }
  }, [phase]);

  return (
    <div className='h-100'>
      <Spin className='h-100' tip="Loading..." size='large' spinning={isLoading}>
        <Row className='h-25'>
          <Col className='player-table' span={5}>
            <Table
              columns={columns}
              dataSource={players}
              pagination={false}
            />
          </Col>
          <Col className='p-2' span={9}>
            <Button type='primary' onClick={connect}>
              Connect
            </Button>
            <p></p>
            {connected && (
              <div>
                <>
                  {account && `Connected account: ${account}`}
                </>
              </div>
            )}
            {
              phase == 'Reset' && <p>Ideal Speed: {idealSpeed}</p>
            }
          </Col>
        </Row>
        <Row className='h-50 align-center'>
          <div className='tunnel'>
            {/* <div className="player-container">
              {players.map((player, index) => (
                <img
                  key={player.id}
                  // ref={playerRefs.current[index]}
                  src={player.src}
                  alt={player.id}
                  style={{left: "50%", top: `${25 * (index + 1)}px`}}
                  // className={`player-${player.id}`}
                />
              ))}
            </div> */}
            <PlayerMovement phase={phase} players={players} />
            <Darkness phase={phase} />
            <RabbitHead phase={phase}/>
            <RabbitTail phase={phase} />
          </div>
        </Row>
        <Row className='h-12'>
          <Col className='flex justify-end' span={11}>
            <div className="panel">
              <div className="number-display">1</div>
            </div>
          </Col>
          <Col className='flex justify-center' span={2}>
            <div className="lever-container">
              <Image className='center-img' src="https://i.ibb.co/fXQVWpW/Lever-handle.png" alt="Rotating Lever" id="lever" preview={false} />
            </div>
          </Col>
          <Col span={11}>
            <div className="panel">
              <div className="number-display">
                <InputNumber
                  min={1}
                  max={10}
                  value={speed}
                  onChange={e => setSpeed(e.valueOf())}
                />
              </div>
            </div>
          </Col>
        </Row>
        <Row className="flex justify-center h-12">
          <Button className='mr-2' type='primary' onClick={handleStartEvent} disabled={state == 'start'}>Start</Button>
          <Button type='primary' onClick={handleChangeSpeed} disabled={state == 'start' ? true : false}>Change Speed</Button>
        </Row>
      </Spin>
    </div>
  );
}

function RabbitHead({ phase }) {
  useEffect(() => {
    const head = document.querySelector('.rabbit-head');
    if (phase === 'CloseTunnel') {
     
      head.style.transform = 'translateX(-130vw)'; 
    } else if (phase === 'OpenTunnel') { // it goes back in position
       head.style.visibility = 'hidden';
      head.style.transform = 'translateX(50vw)';

    } else if (phase === 'Reset') {
        head.style.visibility = 'visible';
      head.style.transform = 'translateX(0)'; 
    }
  }, [phase]);

  return <img className="rabbit-head" src="https://i.ibb.co/pvJj4gh/rabbit.png" alt="Rabbit Head" />;
}

function Darkness({ phase }) {
  useEffect(() => {
    const darkness = document.querySelector('.darkness');
    if (phase === 'CloseTunnel') {
      darkness.style.visibility = 'visible';
      darkness.style.left = '-10%'; // Cover the screen
    } else if (phase === 'OpenTunnel') {
      darkness.style.left = '-110%'; // Move off-screen to the left
    } else if (phase === 'Reset') {
      darkness.style.visibility = 'hidden';
      darkness.style.left = '100%';
   

    }
  }, [phase]);

  return <div className="darkness"></div>;
}

function RabbitTail({ phase }) {
  useEffect(() => {
    const tail = document.querySelector('.rabbit-tail');
    if (phase === 'OpenTunnel') {
      tail.style.visibility = 'visible'; 
      tail.style.transform = 'translateX(-100vw)'; 
      setTimeout(() => {
        tail.style.transform = 'translateX(-100vw) rotate(-25deg) translateY(-20px)';
      }, 1500);
      
      setTimeout(() => {
        tail.style.transform = 'translateX(-150vw)';
      }, 5000);


    } else if (phase === 'Reset') {
      tail.style.visibility = 'hidden';
      tail.style.transform = 'translateX(0) rotate(0) translateY(0)'; 
   
    }
  }, [phase]);

  return <img className="rabbit-tail" src="https://i.ibb.co/3FG2ch1/flufflytail.png" alt="Rabbit Tail" />;
}

const PlayerMovement = ({ phase, players }) => {

  // Sort players by speed
  const sortedPlayers = [...players].sort((a, b) => a.speed - b.speed);
  const playerRefs = useRef(sortedPlayers.map(() => createRef()));

  useEffect(() => {
    sortedPlayers.forEach((player, index) => {
      const playerElement = playerRefs.current[index].current;
      if (!playerElement) return;

      const positionStyle = `${25 * (index + 1)}px`;

      if (phase === 'Default' || phase === 'Reset') {
        setTimeout(() => {
          playerElement.style.transition = 'all 1.5s ease-out';
          playerElement.style.left = '50%';
          playerElement.style.visibility = 'visible';
          playerElement.style.top = positionStyle;
        }, index * 300);
      } else if (phase === 'CloseTunnel') {
        playerElement.style.left = '80%';
        setTimeout(() => {
          playerElement.style.transition = 'all 0.5s ease-out';
          playerElement.style.left = '-100%';
        }, 3000);
      } else if (phase === 'OpenTunnel') {
        const delay = index * 1000;
        setTimeout(() => {
          playerElement.style.top = positionStyle;
          playerElement.style.left = '150vw';
          playerElement.style.transition = 'all 12s ease-out';
        }, 1000 + delay);

        setTimeout(() => {
          playerElement.style.visibility = 'hidden';
          playerElement.style.left = '-10vw';
          playerElement.style.transition = 'none';
        }, 9000 + delay);
      }
    });
  }, [phase]);

  return (
    <div className="player-container">
      {sortedPlayers.map((player, index) => (
        <img
          key={player.id}
          ref={playerRefs.current[index]}
          src={player.src}
          alt={player.id}
          className={`player-${player.id}`}
        />
      ))}
    </div>
  );
};

export default App;