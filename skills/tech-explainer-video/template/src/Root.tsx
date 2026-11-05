import React from "react";
import { Composition, Series } from "remotion";
import timeline from "./timeline.json";
import { Chapter, chapterFrames } from "./lib/beat";
import { CHAPTERS } from "./chapters";
import { Cover } from "./lib/Cover";
import { COVERS } from "./covers";
import { CoverExample } from "./covers/CoverExample";

type Ep = { id: string; title: string; chapters: string[] };
const EPISODES: Ep[] = (timeline as any).episodes ?? [];

const Seq: React.FC<{ ids: string[] }> = ({ ids }) => (
  <Series>
    {ids.map((id) => {
      const { no, C } = CHAPTERS.find((c) => c.id === id)!;
      return (
        <Series.Sequence key={id} durationInFrames={chapterFrames(id)}>
          <Chapter id={id} no={no}><C /></Chapter>
        </Series.Sequence>
      );
    })}
  </Series>
);
const total = (ids: string[]) => ids.reduce((s, id) => s + chapterFrames(id), 0);

export const RemotionRoot: React.FC = () => (
  <>
    {CHAPTERS.map(({ id, no, C }) => (
      <Composition key={id} id={id.replace(/_/g, "-")} durationInFrames={chapterFrames(id)} fps={30} width={1920} height={1080}
        component={() => <Chapter id={id} no={no}><C /></Chapter>} />
    ))}
    {EPISODES.map((ep) => (
      <Composition key={ep.id} id={ep.id} durationInFrames={total(ep.chapters)} fps={30} width={1920} height={1080}
        component={() => <Seq ids={ep.chapters} />} />
    ))}
    {EPISODES.map((ep, i) => (
      <Composition key={`cover-${ep.id}`} id={`cover-${ep.id}`} durationInFrames={1} fps={30} width={1920} height={1080}
        component={COVERS[i + 1] ?? (() => <Cover k={i + 1} />)} />
    ))}
    <Composition id="cover-example" component={CoverExample} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="full" component={() => <Seq ids={CHAPTERS.map((c) => c.id)} />}
      durationInFrames={total(CHAPTERS.map((c) => c.id))} fps={30} width={1920} height={1080} />
  </>
);
