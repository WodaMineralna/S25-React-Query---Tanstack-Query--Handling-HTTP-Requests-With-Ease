import { useState } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

import { fetchEvent, deleteEvent } from "../../util/http.js";

import Header from "../Header.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import { queryClient } from "../../util/queryClient.js";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import Modal from "../UI/Modal.jsx";

export default function EventDetails() {
  const [isDeleting, setIsDeleting] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["events", id],
    queryFn: ({ signal }) => fetchEvent({ signal, id }),
    staleTime: 15000,
  });

  const {
    mutate,
    isPending: isMutationPending,
    isError: isMutationError,
    error: mutationError,
  } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["events"],
        refetchType: "none",
      });
      navigate("/events");
    },
  });

  function handleStartDelete() {
    setIsDeleting(true);
  }

  function handleStopDelete() {
    setIsDeleting(false);
  }

  function handleDeletion() {
    mutate({ id });
  }

  let content;

  if (isPending) {
    content = (
      <div id="event-details-content" className="center">
        <LoadingIndicator />
      </div>
    );
  }

  if (isError) {
    content = (
      <div id="event-details-content" className="center">
        <ErrorBlock
          title="Could not fetch event data"
          message={
            error.info?.message || "There was an error while loading event data"
          }
        />
      </div>
    );
  }

  if (data) {
    content = (
      <article id="event-details">
        <header>
          <h1>{data?.title}</h1>
          <nav>
            <button onClick={handleStartDelete} disabled={isMutationPending}>
              Delete
            </button>
            <Link to="edit" disabled={isMutationPending}>
              Edit
            </Link>
          </nav>
        </header>
        <div id="event-details-content">
          <img
            src={`http://192.168.1.18:3000/${data?.image}`}
            alt={data?.image}
          />
          <div id="event-details-info">
            <div>
              <p id="event-details-location">{data?.location}</p>
              <time
                dateTime={`${data?.date} ${data?.time}`}
              >{`${data?.date}, ${data?.time}`}</time>
            </div>
            <p id="event-details-description">{data?.description}</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <>
      {isDeleting && (
        <Modal onClose={handleStopDelete}>
          <h2>Are you sure?</h2>
          <p>
            Do you really want to delete this event? This action cannot be
            undone!
          </p>
          <div className="form-actions">
            <button
              onClick={handleStopDelete}
              className="button-text"
              disabled={isMutationPending}
            >
              Cancel
            </button>
            <button
              onClick={handleDeletion}
              className="button"
              disabled={isMutationPending}
            >
              {isMutationPending ? "Deleting..." : "Delete"}
            </button>
          </div>
          {isMutationError && (
            <ErrorBlock
              title="Failed to delete the event"
              message={
                mutationError.info?.message || "Could not delete the event"
              }
            />
          )}
        </Modal>
      )}
      <Outlet />
      <Header>
        <Link to="/events" className="nav-item">
          View all Events
        </Link>
      </Header>
      {content}
    </>
  );
}
