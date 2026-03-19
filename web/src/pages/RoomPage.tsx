import { Link, useParams } from "react-router-dom";
import { JoinForm } from "../components/JoinForm";
import { TableView } from "../components/TableView";
import { VoteDeck } from "../components/VoteDeck";
import { StatsPanel } from "../components/StatsPanel";
import { TicketPanel } from "../components/TicketPanel";
import { ErrorBanner } from "../components/ErrorBanner";
import { ShareLink } from "../components/ShareLink";
import { Countdown } from "../components/Countdown";
import { SiteHeader } from "../components/SiteHeader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRoomPageState } from "../hooks/useRoomPageState";

function VisibilityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  );
}

function RestartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  );
}

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();

  if (!roomId)
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-lg text-error">Invalid room URL</div>
    );

  const {
    activeRoom,
    activeThrows,
    addTicket,
    clearError,
    documentTitle,
    error,
    handleCountdownComplete,
    handleJoin,
    handleReveal,
    handleThrowPaperBall,
    handleVote,
    identity,
    joinStatus,
    pageStage,
    removeTicket,
    restart,
    roomState,
    selectedVote,
    setCurrentTicket,
    showCountdown,
    subtitle,
  } = useRoomPageState(roomId);

  useDocumentTitle(documentTitle);

  const headerAction = activeRoom && pageStage !== "room-unavailable" ? <ShareLink /> : undefined;

  if (pageStage === "room-unavailable") {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <SiteHeader title="Room not found" subtitle="This room may have expired or the link may be incorrect." />
        <main className="mx-auto flex min-h-[calc(100vh-180px)] max-w-lg items-center justify-center px-6 py-12">
          <div className="nocturne-glass w-full rounded-4xl border border-outline-variant/15 p-10 text-center shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
            <h2 className="text-2xl font-bold text-on-surface">Room not found</h2>
            <p className="mt-3 text-on-surface-variant">Rooms expire after 24 hours without activity.</p>
            <Link
              to="/"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-container px-8 py-3.5 font-bold text-on-primary shadow-[0_10px_30px_rgba(78,222,163,0.2)] transition-transform hover:scale-[1.02] active:scale-95">
              Back to home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (pageStage === "connecting" || pageStage === "restoring") {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <SiteHeader
          title={activeRoom?.name ?? "Planning Poker"}
          subtitle="Connecting to the room..."
          action={headerAction}
        />
        <div className="flex min-h-[calc(100vh-180px)] items-center justify-center px-6 text-lg text-on-surface-variant">
          Connecting…
        </div>
      </div>
    );
  }

  const liveRoom = roomState!;

  const showRoomContext = pageStage === "room" && Boolean(activeRoom);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <SiteHeader
        roomContext={
          showRoomContext && activeRoom
            ? {
                roomName: activeRoom.name,
                ticketKey: liveRoom.currentTicketKey,
                participantCount: liveRoom.participants.length,
              }
            : undefined
        }
        title={undefined}
        subtitle={undefined}
        action={headerAction}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-5">
        <ErrorBanner error={error} onDismiss={clearError} />

        {pageStage === "join-form" ? (
          <JoinForm
            defaultName={identity?.name}
            roomName={activeRoom?.name}
            onJoin={handleJoin}
            disabled={joinStatus === "submitting"}
            loading={joinStatus === "submitting"}
          />
        ) : pageStage === "loading-room" ? (
          <div className="flex min-h-[50vh] items-center justify-center text-lg text-on-surface-variant">Loading room…</div>
        ) : (
          <div className="flex flex-col gap-6 md:gap-7">
            {subtitle ? (
              <p className="text-center text-sm text-on-surface-variant md:hidden">
                {subtitle}
              </p>
            ) : null}

            <TableView
              participants={liveRoom.participants}
              roomStatus={liveRoom.status}
              currentParticipantId={identity?.participantId ?? null}
              activeThrows={activeThrows}
              onThrowPaperBall={handleThrowPaperBall}>
              {showCountdown ? (
                <Countdown onComplete={handleCountdownComplete} />
              ) : (
                <>
                  {liveRoom.participants.length > 0 &&
                    (liveRoom.status !== "revealed" ? (
                      <button
                        type="button"
                        className="relative flex items-center gap-2 rounded-full bg-linear-to-tr from-primary to-primary-container px-6 py-2.5 text-sm font-bold text-on-primary shadow-[0_0_24px_rgba(78,222,163,0.25)] transition-transform hover:scale-[1.02] active:scale-95 md:px-8 md:py-3 md:text-base"
                        onClick={handleReveal}>
                        <VisibilityIcon className="size-5" />
                        Reveal votes
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-full border border-outline-variant/25 bg-surface-container-high px-6 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:border-primary/35 hover:bg-surface-container active:scale-95"
                        onClick={restart}>
                        <RestartIcon className="size-5 text-on-surface-variant" />
                        Start new round
                      </button>
                    ))}
                </>
              )}
            </TableView>

            <VoteDeck selectedVote={selectedVote} onVote={handleVote} />

            <TicketPanel
              roomStatus={liveRoom.status}
              tickets={liveRoom.tickets}
              votedTickets={liveRoom.votedTickets ?? []}
              currentTicketKey={liveRoom.currentTicketKey}
              voteHistory={liveRoom.voteHistory}
              onAddTicket={addTicket}
              onRemoveTicket={removeTicket}
              onSetCurrentTicket={setCurrentTicket}
            />

            {liveRoom.status === "revealed" && liveRoom.stats ? <StatsPanel stats={liveRoom.stats} /> : null}
          </div>
        )}
      </main>
    </div>
  );
}
