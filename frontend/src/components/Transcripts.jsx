import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Input, Button } from 'antd';

import { useGetCryptosQuery } from '../services/cryptoApi';
import Loader from './Loader';

const Transcripts = ({ simplified }) => {
  const count = simplified ? 10 : 100;
  const { data: cryptosList, isFetching } = useGetCryptosQuery(count);
  const [cryptos, setCryptos] = useState();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setCryptos(cryptosList);

    const filteredData = cryptosList?.filter((item) => item.title.toLowerCase().includes(searchTerm));

    setCryptos(filteredData);
  }, [cryptosList, searchTerm]);

  if (isFetching) return <Loader />;

  return (
    <>

      {!simplified && (
        <div className="search-crypto">
          <Input
            placeholder="Search Transcript"
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
        </div>
      )}
      <Row gutter={[32, 32]} className="crypto-card-container">
        {cryptos?.map((item) => (
          <Col
            xs={24}
            sm={12}
            lg={6}
            className="crypto-card"
            key={item.id}
          >

            {/* Note: Change item.id to item.uuid  */}
            <Link key={item.id} to={`/crypto/${item.id}`}>
              <Card
                title={`${item.title}`}
                extra={<Button>claim</Button>}
                hoverable
              >
                <p>{item.details}</p>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default Transcripts;
