// src/pages/WholesaleRequests.jsx

import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardBody,
  Col,
  Container,
  CardHeader,
  Row,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  Label,
  Input,
} from 'reactstrap';
import { toast, ToastContainer } from 'react-toastify';
import db from '../../appwrite/Services/dbServices';
import TableContainer from '../../Components/Common/TableContainer';
import { Query } from 'appwrite';

const WholesaleRequests = () => {
  const [requests, setRequests] = useState([]);
  const [usersData, setUsersData] = useState({});
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // New state variable for search term

  // Fetch wholesale requests and user data
  const fetchWholesaleRequests = async () => {
    try {
      const response = await db.WholesaleAccountRequests.list();
      setRequests(response.documents);

      // Fetch user details for each request
      const usersMap = {};
      for (const request of response.documents) {
        const userId = request.userId;
        try {
          // Fetch user where 'userId' field equals the userId from the request
          const userList = await db.Users.list([Query.equal('userId', userId)]);
          if (userList.total > 0) {
            usersMap[userId] = userList.documents[0];
          } else {
            console.error(`User with userId ${userId} not found.`);
            usersMap[userId] = { name: 'Unknown', email: '' };
          }
        } catch (error) {
          console.error(`Error fetching user with userId ${userId}:`, error);
          usersMap[userId] = { name: 'Unknown', email: '' };
        }
      }
      setUsersData(usersMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching wholesale requests:', error);
      toast.error('Failed to fetch wholesale requests.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWholesaleRequests();
  }, []);

  // Handle approving a wholesale request
  const handleApprove = async (request) => {
    try {
      // Update the request status to 'approved'
      await db.WholesaleAccountRequests.update(request.$id, { status: 'approved' });

      // Update the user's isWholesaleApproved property to true
      // First, fetch the user document ID from the Users collection
      const userId = request.userId;
      const userList = await db.Users.list([Query.equal('userId', userId)]);
      if (userList.total > 0) {
        const userDocId = userList.documents[0].$id;
        await db.Users.update(userDocId, { isWholesaleApproved: true });
      } else {
        console.error(`User with userId ${userId} not found.`);
      }

      toast.success('Request approved successfully.');
      fetchWholesaleRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request.');
    }
  };

  // Handle rejecting a wholesale request
  const handleReject = (request) => {
    setSelectedRequest(request);
    setRejectModal(true);
  };

  // Confirm rejection and update the request status
  const confirmReject = async () => {
    try {
      const updateData = {
        status: 'rejected',
      };

      // If the admin provided a rejection reason, update the 'reason' field
      if (rejectReason) {
        updateData.reason = rejectReason;
      }

      // Update the request status
      await db.WholesaleAccountRequests.update(selectedRequest.$id, updateData);

      // Update the user's isWholesaleApproved property to false
      const userId = selectedRequest.userId;
      const userList = await db.Users.list([Query.equal('userId', userId)]);
      if (userList.total > 0) {
        const userDocId = userList.documents[0].$id;
        await db.Users.update(userDocId, { isWholesaleApproved: false });
      } else {
        console.error(`User with userId ${userId} not found.`);
      }

      toast.success('Request rejected successfully.');
      setRejectModal(false);
      setRejectReason('');
      fetchWholesaleRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request.');
    }
  };

  // Filter requests based on the search term and user name
  const filteredRequests = useMemo(() => {
    if (!searchTerm) {
      return requests;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return requests.filter((request) => {
      const user = usersData[request.userId];
      if (user && user.name) {
        return user.name.toLowerCase().includes(lowercasedSearchTerm);
      }
      return false;
    });
  }, [searchTerm, requests, usersData]);

  // Define columns for the table
  const columns = useMemo(
    () => [
      {
        header: 'User',
        id: 'user',
        accessorKey: 'userId',
        disableFilters: true,
        cell: ({ row }) => {
          const userId = row.original.userId;
          const user = usersData[userId];
          return user ? (
            <div>
              <div>{user.name}</div>
              <div>{user.email}</div>
            </div>
          ) : (
            'Loading...'
          );
        },
      },
      {
        header: 'Reason',
        accessorKey: 'reason',
        disableFilters: true,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        id: 'status',
        disableFilters: true,
        cell: ({ cell }) => {
          const status = cell.getValue();
          let badgeClass = '';
          switch (status) {
            case 'pending':
              badgeClass = 'bg-warning text-dark';
              break;
            case 'approved':
              badgeClass = 'bg-success text-white';
              break;
            case 'rejected':
              badgeClass = 'bg-danger text-white';
              break;
            default:
              badgeClass = 'bg-secondary text-white';
          }
          return <span className={`badge ${badgeClass}`}>{status}</span>;
        },
      },
      {
        header: 'Actions',
        id: 'actions',
        disableFilters: true,
        cell: ({ row }) => {
          const request = row.original;
          return (
            <div className="d-flex">
              <Button
                color="success"
                size="sm"
                className="me-2"
                onClick={() => handleApprove(request)}
                disabled={request.status === 'approved'}
              >
                Approve
              </Button>
              <Button
                color="danger"
                size="sm"
                onClick={() => handleReject(request)}
                disabled={request.status === 'rejected'}
              >
                Reject
              </Button>
            </div>
          );
        },
      },
    ],
    [usersData]
  );

  return (
    <div className="page-content">
      <ToastContainer closeButton={false} limit={1} />
      <Container fluid>
        {/* Search Input */}
        <Row className="mb-3">
          <Col lg={4}>
            <Input
              type="text"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
        </Row>

        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader>
                <h4 className="card-title mb-0">Wholesale Account Requests</h4>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div>Loading...</div>
                ) : (
                  <TableContainer
                    columns={columns}
                    data={filteredRequests} // Use filtered requests here
                    isGlobalFilter={false}
                    isFilter={false}
                    customPageSize={10}
                    divClass="table-responsive"
                    tableClass="table align-middle table-nowrap"
                    theadClass="table-light"
                    SearchPlaceholder=""
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal}
        toggle={() => setRejectModal(!rejectModal)}
        centered
      >
        <ModalHeader toggle={() => setRejectModal(!rejectModal)}>
          Reject Request
        </ModalHeader>
        <ModalBody>
          <Form>
            <Label for="rejectReason">Reason for rejection (optional)</Label>
            <Input
              type="textarea"
              id="rejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="text-end mt-3">
              <Button
                color="secondary"
                className="me-2"
                onClick={() => setRejectModal(false)}
              >
                Cancel
              </Button>
              <Button color="danger" onClick={confirmReject}>
                Reject
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default WholesaleRequests;
