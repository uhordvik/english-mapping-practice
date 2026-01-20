'use client';

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/** -----------------------------
 *  Helpers
 *  ----------------------------- */
function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAnyKeyword(text: string, keywords: string[] = []) {
  const t = normalize(text);
  return keywords.some((k) => t.includes(normalize(k)));
}

function equalsAny(text: string, accepted: string[] = []) {
  const t = normalize(text);
  return accepted.map(normalize).includes(t);
}

/** -----------------------------
 *  Question Types
 *  ----------------------------- */
type MCQOption = { id: "a" | "b" | "c"; label: string };

type ItemBase = {
  id: string;
  prompt: string;
  guidance?: string;
};

type MCQItem = ItemBase & {
  type: "mcq";
  options: MCQOption[];
  answer: "a" | "b" | "c";
};

type TextAutoItem = ItemBase & {
  type: "text";
  acceptedAnswers: string[]; // exact-ish match after normalize()
};

type ShortItem = ItemBase & {
  type: "short";
  keywords?: string[]; // for gentle hints only (not grading)
};

type WritingItem = ItemBase & {
  type: "writing";
};

type Item = MCQItem | TextAutoItem | ShortItem | WritingItem;

type Section = {
  id: string;
  name: string;
  items: Item[];
};

type Test = {
  title: string;
  readingTitle: string;
  readingText: string;
  sections: Section[];
};

/** -----------------------------
 *  Tests
 *  ----------------------------- */
const TESTS: Record<string, Test> = {
  original: {
    title: "Practice Test – Mixed Skills",
    readingTitle: "A New School Year",
    readingText: `Emma started 8th grade last Monday. She was nervous but excited. Her new school was bigger than her old one, and she had to find her classrooms on her own. At first, it was confusing, but her teachers were friendly and helpful.

Emma’s favourite subject is English because she enjoys reading and writing stories. This year, she also joined the school drama club. She hopes it will help her become more confident.`,
    sections: [
      {
        id: "reading",
        name: "Task 1: Reading Comprehension",
        items: [
          {
            id: "r1",
            type: "short",
            prompt: "How did Emma feel about starting 8th grade?",
            guidance: "Write 1 sentence.",
            keywords: ["nervous", "excited"],
          },
          {
            id: "r2",
            type: "short",
            prompt: "Why was the new school difficult at first?",
            guidance: "Write 1 sentence.",
            keywords: ["bigger", "find", "classrooms", "on her own", "confusing"],
          },
          {
            id: "r3",
            type: "short",
            prompt: "What is Emma’s favourite subject, and why?",
            guidance: "Write 1 sentence.",
            keywords: ["English", "reading", "writing", "stories"],
          },
          {
            id: "r4",
            type: "short",
            prompt: "What does Emma hope the drama club will help her with?",
            guidance: "Write 1 sentence.",
            keywords: ["confident", "confidence"],
          },
        ],
      },
      {
        id: "vocab",
        name: "Task 2: Vocabulary",
        items: [
          {
            id: "v1",
            type: "mcq",
            prompt: "Emma was ______ about her new school.",
            options: [
              { id: "a", label: "angry" },
              { id: "b", label: "excited" },
              { id: "c", label: "bored" },
            ],
            answer: "b",
          },
          {
            id: "v2",
            type: "mcq",
            prompt: "The teachers were friendly and ______.",
            options: [
              { id: "a", label: "helpful" },
              { id: "b", label: "noisy" },
              { id: "c", label: "strict" },
            ],
            answer: "a",
          },
          {
            id: "v3",
            type: "mcq",
            prompt: "Emma enjoys ______ stories.",
            options: [
              { id: "a", label: "breaking" },
              { id: "b", label: "reading" },
              { id: "c", label: "losing" },
            ],
            answer: "b",
          },
        ],
      },
      {
        id: "grammar",
        name: "Task 3: Grammar",
        items: [
          {
            id: "g1",
            type: "mcq",
            prompt: "Emma ___ to school last Monday.",
            options: [
              { id: "a", label: "go" },
              { id: "b", label: "goes" },
              { id: "c", label: "went" },
            ],
            answer: "c",
          },
          {
            id: "g2",
            type: "mcq",
            prompt: "She ___ English lessons every week.",
            options: [
              { id: "a", label: "has" },
              { id: "b", label: "had" },
              { id: "c", label: "will have" },
            ],
            answer: "a",
          },
          {
            id: "g3",
            type: "mcq",
            prompt: "They ___ in the drama club tomorrow.",
            options: [
              { id: "a", label: "are" },
              { id: "b", label: "were" },
              { id: "c", label: "will be" },
            ],
            answer: "c",
          },
        ],
      },
      {
        id: "structure",
        name: "Task 4: Sentence Structure",
        items: [
          {
            id: "s1",
            type: "text",
            prompt: "Put the words in the correct order: school / new / her / likes / she",
            guidance: "Type the full sentence.",
            acceptedAnswers: ["She likes her new school."],
          },
          {
            id: "s2",
            type: "text",
            prompt: "Put the words in the correct order: English / favourite / is / subject / her",
            guidance: "Type the full sentence.",
            acceptedAnswers: ["English is her favourite subject."],
          },
        ],
      },
      {
        id: "writing",
        name: "Task 5: Writing",
        items: [
          {
            id: "w1",
            type: "writing",
            prompt:
              "Write 6–8 sentences about ONE: (1) Your favourite school subject, (2) Your first day at a new school, or (3) A hobby you enjoy.",
            guidance:
              "Use full sentences. Try correct verb tenses, spelling, and punctuation.",
          },
        ],
      },
      {
        id: "instructions",
        name: "Task 6: Instructions & Understanding",
        items: [
          {
            id: "i1",
            type: "short",
            prompt: "Describe one thing you like about your school. (2–3 sentences.)",
            guidance: "Write 2–3 sentences.",
          },
        ],
      },
      {
        id: "listening",
        name: "Task 7: Listening-style (Reading Instead)",
        items: [
          {
            id: "l1",
            type: "short",
            prompt:
              "Dialogue: Teacher: “Did you finish your homework?” Student: “I started it, but I didn’t understand the last task.”\n\nQuestion: Why didn’t the student finish the homework?",
            guidance: "Write 1 sentence.",
            keywords: ["didn’t understand", "last task"],
          },
        ],
      },
    ],
  },

  day1: {
    title: "Practice Test – Reading & Vocabulary",
    readingTitle: "After School Activities",
    readingText: `Many students enjoy after-school activities. Some prefer sports like football or basketball, while others choose music, drama, or art clubs. These activities help students relax after a long school day and make new friends.

Jake joined the school football team this year. At first, he felt unsure because he had never played before. However, his teammates supported him, and now he looks forward to practice every week.`,
    sections: [
      {
        id: "reading",
        name: "Task 1: Reading Comprehension",
        items: [
          {
            id: "q1",
            type: "short",
            prompt: "Why do many students like after-school activities?",
            guidance: "Write 1–2 sentences.",
            keywords: ["relax", "friends", "make new friends"],
          },
          {
            id: "q2",
            type: "short",
            prompt: "Name two types of after-school activities mentioned in the text.",
            guidance: "Write two activities.",
            keywords: ["football", "basketball", "music", "drama", "art"],
          },
          {
            id: "q3",
            type: "short",
            prompt: "How did Jake feel at first when he joined the football team?",
            guidance: "Write 1 sentence.",
            keywords: ["unsure"],
          },
          {
            id: "q4",
            type: "short",
            prompt: "Why does Jake enjoy practice now?",
            guidance: "Write 1 sentence.",
            keywords: ["teammates", "supported", "support"],
          },
        ],
      },
      {
        id: "vocab",
        name: "Task 2: Vocabulary",
        items: [
          {
            id: "mc1",
            type: "mcq",
            prompt: "After-school activities help students ______.",
            options: [
              { id: "a", label: "worry" },
              { id: "b", label: "relax" },
              { id: "c", label: "argue" },
            ],
            answer: "b",
          },
          {
            id: "mc2",
            type: "mcq",
            prompt: "Jake felt ______ at first.",
            options: [
              { id: "a", label: "confident" },
              { id: "b", label: "unsure" },
              { id: "c", label: "angry" },
            ],
            answer: "b",
          },
          {
            id: "mc3",
            type: "mcq",
            prompt: "His teammates ______ him.",
            options: [
              { id: "a", label: "ignored" },
              { id: "b", label: "supported" },
              { id: "c", label: "forgot" },
            ],
            answer: "b",
          },
        ],
      },
      {
        id: "context",
        name: "Task 3: Vocabulary in Context",
        items: [
          {
            id: "mc4",
            type: "mcq",
            prompt: "I like joining clubs because I can make new ______.",
            options: [
              { id: "a", label: "homework" },
              { id: "b", label: "friends" },
              { id: "c", label: "teachers" },
            ],
            answer: "b",
          },
          {
            id: "mc5",
            type: "mcq",
            prompt: "She looks forward to football ______ every week.",
            options: [
              { id: "a", label: "practice" },
              { id: "b", label: "break" },
              { id: "c", label: "lesson" },
            ],
            answer: "a",
          },
        ],
      },
      {
        id: "writing",
        name: "Task 4: Short Answer",
        items: [
          {
            id: "wDay1",
            type: "writing",
            prompt: "What after-school activity would you like to join, and why?",
            guidance: "Write ONE full sentence.",
          },
        ],
      },
      {
        id: "title",
        name: "Task 5: Instructions",
        items: [
          {
            id: "mc6",
            type: "mcq",
            prompt: "Choose the best title for the text.",
            options: [
              { id: "a", label: "A Difficult School Day" },
              { id: "b", label: "Learning in the Classroom" },
              { id: "c", label: "After-School Activities" },
            ],
            answer: "c",
          },
        ],
      },
    ],
  },

  day2: {
    title: "Practice Test – Grammar & Sentences",
    readingTitle: "School Life",
    readingText: `Tom goes to a secondary school in a small town. He likes English lessons, but he finds grammar difficult. Every day, he practices by writing short sentences and reading English texts.`,
    sections: [
      {
        id: "grammar",
        name: "Task 1: Grammar (Choose the correct answer)",
        items: [
          {
            id: "d2_1",
            type: "mcq",
            prompt: "Tom ____ to a secondary school.",
            options: [
              { id: "a", label: "go" },
              { id: "b", label: "goes" },
              { id: "c", label: "went" },
            ],
            answer: "b",
          },
          {
            id: "d2_2",
            type: "mcq",
            prompt: "He ____ grammar difficult.",
            options: [
              { id: "a", label: "finds" },
              { id: "b", label: "found" },
              { id: "c", label: "will find" },
            ],
            answer: "a",
          },
          {
            id: "d2_3",
            type: "mcq",
            prompt: "Yesterday, Tom ____ English texts.",
            options: [
              { id: "a", label: "reads" },
              { id: "b", label: "read" },
              { id: "c", label: "will read" },
            ],
            answer: "b",
          },
        ],
      },
      {
        id: "sentences",
        name: "Task 2: Build sentences",
        items: [
          {
            id: "d2_s1",
            type: "text",
            prompt: "Write this in the past tense: “Tom goes to school.”",
            guidance: "Type the full sentence.",
            acceptedAnswers: ["Tom went to school."],
          },
          {
            id: "d2_s2",
            type: "short",
            prompt: "Write one sentence in the present tense about yourself.",
            guidance: "Example: I play football. / I like English.",
          },
          {
            id: "d2_s3",
            type: "short",
            prompt: "Write one sentence in the future tense about tomorrow.",
            guidance: "Example: I will study English tomorrow.",
            keywords: ["will"],
          },
        ],
      },
      {
        id: "writing",
        name: "Task 3: Short Writing",
        items: [
          {
            id: "d2_w1",
            type: "writing",
            prompt: "Write 3–4 sentences: How do you practice English outside school?",
            guidance: "Use full sentences.",
          },
        ],
      },
    ],
  },
};

/** -----------------------------
 *  UI Pieces
 *  ----------------------------- */
function RadioOption({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (val: string) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-2xl border hover:bg-muted/40 cursor-pointer">
      <input
        className="mt-1"
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />
      <span className="text-sm leading-5">{label}</span>
    </label>
  );
}

/** -----------------------------
 *  App
 *  ----------------------------- */
export default function App() {
  const [selectedTestKey, setSelectedTestKey] = useState<keyof typeof TESTS>("day1");
  const TEST = TESTS[selectedTestKey];

  const [tab, setTab] = useState<"read" | "test" | "results">("read");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selfScoreWriting, setSelfScoreWriting] = useState<number | null>(null); // 0 or 1
  const [finished, setFinished] = useState(false);

  const allItems = useMemo(
    () =>
      TEST.sections.flatMap((s) => s.items.map((it) => ({ ...it, sectionName: s.name }))),
    [TEST]
  );

  const autoScoredItems = useMemo(
    () => allItems.filter((it) => it.type === "mcq" || it.type === "text"),
    [allItems]
  );

  const totalAutoPoints = autoScoredItems.length;
  const totalPoints = totalAutoPoints + 1; // +1 optional writing self-check

  const attemptedCount = useMemo(() => {
    return allItems.filter((it) => {
      const a = answers[it.id];
      if (it.type === "mcq") return !!a;
      return typeof a === "string" && a.trim().length > 0;
    }).length;
  }, [allItems, answers]);

  const progress = useMemo(() => {
    return Math.round((attemptedCount / allItems.length) * 100);
  }, [attemptedCount, allItems.length]);

  const isComplete = useMemo(() => {
    // Require every question to be answered before "Finish"
    return allItems.every((it) => {
      const a = answers[it.id];
      if (it.type === "mcq") return !!a;
      return typeof a === "string" && a.trim().length > 0;
    });
  }, [allItems, answers]);

  const autoScore = useMemo(() => {
    let correct = 0;
    for (const it of autoScoredItems) {
      const given = answers[it.id] || "";
      if (it.type === "mcq") {
        if (given === it.answer) correct += 1;
      } else if (it.type === "text") {
        if (equalsAny(given, it.acceptedAnswers)) correct += 1;
      }
    }
    return correct;
  }, [answers, autoScoredItems]);

  const finalScore = autoScore + (selfScoreWriting ?? 0);

  const shortHints = useMemo(() => {
    const shortItems = allItems.filter((it) => it.type === "short") as ShortItem[];
    return shortItems.map((it) => {
      const text = answers[it.id] || "";
      const ok = text.trim().length > 0;
      const hasHint = it.keywords?.length ? containsAnyKeyword(text, it.keywords) : true;
      return { id: it.id, prompt: it.prompt, ok, hasHint, keywords: it.keywords || [] };
    });
  }, [allItems, answers]);

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function resetAllToReading() {
    setAnswers({});
    setSelfScoreWriting(null);
    setFinished(false);
    setTab("read");
  }

  function onChangeTest(key: keyof typeof TESTS) {
    setSelectedTestKey(key);
    // Reset everything when switching tests
    setAnswers({});
    setSelfScoreWriting(null);
    setFinished(false);
    setTab("read");
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">Choose practice test</label>
                <select
                  className="rounded-xl border p-2 max-w-sm bg-background"
                  value={selectedTestKey}
                  onChange={(e) => onChangeTest(e.target.value as keyof typeof TESTS)}
                  disabled={tab === "test" && !finished}
                  title={tab === "test" && !finished ? "Finish the test before switching tests." : undefined}
                >
                  <option value="day1">Reading & Vocabulary</option>
                  <option value="original">Mixed Skills</option>
                  <option value="day2">Grammar & Sentences</option>
                </select>
              </div>

              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{TEST.title}</h1>
              <p className="text-sm text-muted-foreground">
                Read the text, take the test, then see your score at the end.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                Progress: {progress}%
              </Badge>
              <div className="w-40">
                <Progress value={progress} />
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={tab === "read" ? "default" : "secondary"}
            className="rounded-2xl"
            onClick={() => setTab("read")}
            disabled={tab === "test" && !finished}
            title={tab === "test" && !finished ? "Finish the test to go back to Reading." : undefined}
          >
            Reading
          </Button>

          <Button
            variant={tab === "test" ? "default" : "secondary"}
            className="rounded-2xl"
            onClick={() => setTab("test")}
          >
            Test
          </Button>

          <Button
            variant={tab === "results" ? "default" : "secondary"}
            className="rounded-2xl"
            onClick={() => setTab("results")}
            disabled={!finished}
            title={!finished ? "Finish the test to view results." : undefined}
          >
            Results
          </Button>

          <div className="flex-1" />

          <Button variant="outline" className="rounded-2xl" onClick={resetAllToReading}>
            Reset
          </Button>
        </div>

        {tab === "read" && (
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">{TEST.readingTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-line leading-7">{TEST.readingText}</p>
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Tip: Read once for meaning, then again to find details.
                </div>
                <Button className="rounded-2xl" onClick={() => setTab("test")}>
                  Start the test
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "test" && (
          <div className="space-y-6">
            {TEST.sections.map((section) => (
              <Card key={section.id} className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{section.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.items.map((it, idx) => (
                    <div key={it.id} className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="rounded-full">
                          {idx + 1}
                        </Badge>
                        <div>
                          <div className="font-medium whitespace-pre-line">{it.prompt}</div>
                          {it.guidance ? (
                            <div className="text-sm text-muted-foreground mt-1">{it.guidance}</div>
                          ) : null}
                        </div>
                      </div>

                      {it.type === "mcq" && (
                        <div className="grid gap-2">
                          {it.options.map((opt) => (
                            <RadioOption
                              key={opt.id}
                              name={it.id}
                              value={opt.id}
                              label={`${opt.id.toUpperCase()}) ${opt.label}`}
                              checked={(answers[it.id] || "") === opt.id}
                              onChange={(val) => setAnswer(it.id, val)}
                            />
                          ))}
                        </div>
                      )}

                      {(it.type === "short" || it.type === "text") && (
                        <Textarea
                          className="rounded-2xl min-h-[90px]"
                          placeholder="Write your answer here…"
                          value={answers[it.id] || ""}
                          onChange={(e) => setAnswer(it.id, e.target.value)}
                        />
                      )}

                      {it.type === "writing" && (
                        <div className="space-y-3">
                          <Textarea
                            className="rounded-2xl min-h-[140px]"
                            placeholder="Write your answer here…"
                            value={answers[it.id] || ""}
                            onChange={(e) => setAnswer(it.id, e.target.value)}
                          />

                          <div className="p-3 rounded-2xl border bg-muted/30">
                            <div className="text-sm font-medium">Self-check (for 1 point)</div>
                            <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2 space-y-1">
                              <li>Did you follow the instruction (number of sentences)?</li>
                              <li>Are your sentences clear and understandable?</li>
                              <li>Did you try correct verb tenses and punctuation?</li>
                            </ul>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Button
                                type="button"
                                variant={selfScoreWriting === 1 ? "default" : "secondary"}
                                className="rounded-2xl"
                                onClick={() => setSelfScoreWriting(1)}
                              >
                                Yes (1 point)
                              </Button>
                              <Button
                                type="button"
                                variant={selfScoreWriting === 0 ? "default" : "secondary"}
                                className="rounded-2xl"
                                onClick={() => setSelfScoreWriting(0)}
                              >
                                Not yet (0)
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="h-px bg-border" />
                    </div>
                  ))}

                  <div className="text-sm text-muted-foreground">
                    Answer all questions, then scroll down and click <span className="font-medium">Finish test</span>.
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Finish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Results will be available only after you finish the test.
                </div>
                <Button
                  className="rounded-2xl"
                  disabled={!isComplete}
                  onClick={() => {
                    setFinished(true);
                    setTab("results");
                  }}
                >
                  {isComplete ? "Finish test and view results" : "Answer all questions to finish"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "results" && (
          <div className="space-y-6">
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Your Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-3xl font-semibold">
                      {finalScore} / {totalPoints}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Auto-scored: {autoScore} / {totalAutoPoints} • Writing self-check:{" "}
                      {selfScoreWriting ?? "—"} / 1
                    </div>
                  </div>
                  <div className="w-full md:w-64">
                    <Progress value={Math.round((finalScore / totalPoints) * 100)} />
                    <div className="text-sm text-muted-foreground mt-1">
                      {Math.round((finalScore / totalPoints) * 100)}%
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl border bg-muted/30 text-sm">
                  <div className="font-medium">How to improve next time</div>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                    <li>Re-read the text and underline key details.</li>
                    <li>Practice common verbs in present, past, and future tense.</li>
                    <li>Answer in full sentences when asked.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Short Answer Hints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Gentle hints based on keywords (not strict grading).
                </div>

                {shortHints.map((h) => (
                  <div key={h.id} className="p-3 rounded-2xl border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium whitespace-pre-line">{h.prompt}</div>
                      <Badge className="rounded-full" variant={h.ok && h.hasHint ? "default" : "secondary"}>
                        {h.ok ? (h.hasHint ? "Looks on track" : "Check details") : "Not answered"}
                      </Badge>
                    </div>
                    {h.ok && !h.hasHint && h.keywords.length > 0 ? (
                      <div className="text-sm text-muted-foreground mt-2">
                        Tip: Try including one of these ideas: {h.keywords.join(", ")}
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Export / Share</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Copy your answers to share with a teacher/parent.
                </div>
                <Textarea
                  className="rounded-2xl min-h-[180px]"
                  readOnly
                  value={TEST.sections
                    .flatMap((s) =>
                      s.items.map((it) => {
                        const a = answers[it.id];
                        if (it.type === "mcq") {
                          const label = it.options.find((o) => o.id === a)?.label;
                          return `${s.name} • ${it.prompt}\nAnswer: ${
                            a ? a.toUpperCase() + ") " + label : "—"
                          }`;
                        }
                        return `${s.name} • ${it.prompt}\nAnswer: ${
                          a && String(a).trim().length ? a : "—"
                        }`;
                      })
                    )
                    .join("\n\n")}
                />

                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-2xl" onClick={() => setTab("test")}>
                    Back to test
                  </Button>
                  <Button variant="secondary" className="rounded-2xl" onClick={resetAllToReading}>
                    Start over
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <footer className="text-xs text-muted-foreground pt-2 pb-6">
          Built for practice. Tip: clear, correct sentences beat long, complicated ones.
        </footer>
      </div>
    </div>
  );
}
