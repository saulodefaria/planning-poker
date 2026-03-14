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

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();

  if (!roomId)
    return <div className="flex items-center justify-center min-h-screen text-red-500 text-xl">Invalid room URL</div>;

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

  if (pageStage === "room-unavailable") {
    return (
      <div className="min-h-screen">
        <SiteHeader title="Room not found" subtitle="This room may have expired or the link may be incorrect." />
        <main className="mx-auto flex min-h-[calc(100vh-145px)] max-w-2xl items-center justify-center px-4 py-8">
          <div className="w-full rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl shadow-slate-950/20">
            <h2 className="text-2xl font-semibold text-white">Room not found</h2>
            <p className="mt-3 text-slate-400">Rooms expire after 24 hours without activity.</p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-xl bg-blue-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-600">
              Go to homepage
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (pageStage === "connecting" || pageStage === "restoring") {
    return (
      <div className="min-h-screen">
        <SiteHeader
          title={activeRoom?.name ?? "Planning Poker"}
          subtitle="Connecting to the room..."
          action={activeRoom ? <ShareLink /> : undefined}
        />
        <div className="flex min-h-[calc(100vh-145px)] items-center justify-center px-4 text-lg text-slate-400">
          Connecting...
        </div>
      </div>
    );
  }

  const liveRoom = roomState!;

  return (
    <div className="min-h-screen">
      <SiteHeader
        title={activeRoom?.name ?? "Planning Poker"}
        subtitle={subtitle}
        action={activeRoom ? <ShareLink /> : undefined}
      />

      <main className="mx-auto max-w-3xl px-4 py-6 w-full">
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
          <div className="flex items-center justify-center min-h-[50vh] text-slate-400 text-lg">Loading room...</div>
        ) : (
          <>
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
                        className="px-8 py-2.5 text-base font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors cursor-pointer"
                        onClick={handleReveal}>
                        Reveal Votes
                      </button>
                    ) : (
                      <button
                        className="px-8 py-2.5 text-base font-semibold bg-violet-400 hover:bg-violet-500 text-white rounded-lg transition-colors cursor-pointer"
                        onClick={restart}>
                        Start New Round
                      </button>
                    ))}
                </>
              )}
            </TableView>

            <VoteDeck selectedVote={selectedVote} onVote={handleVote} />

            {liveRoom.status === "revealed" && liveRoom.stats ? <StatsPanel stats={liveRoom.stats} /> : null}

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
          </>
        )}
      </main>
    </div>
  );
}
