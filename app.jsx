import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { WebsimSocket, useQuery } from "@websim/use-query";
import { marked } from "marked";
import DOMPurify from "dompurify";
const room = new WebsimSocket();
function App() {
  const [currentWord, setCurrentWord] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const { data: comments, loading: commentsLoading } = useQuery(room.collection("comment"));
  const { data: leaderboardWords, loading: wordsLoading } = useQuery(room.collection("leaderboard_word"));
  const { data: writingStates, loading: stateLoading } = useQuery(room.collection("writing_state"));
  const writingState = writingStates?.[0];
  useEffect(() => {
    async function loadUser() {
      const user = await window.websim.getCurrentUser();
      setCurrentUser(user);
    }
    loadUser();
  }, []);
  useEffect(() => {
    if (!stateLoading && (!writingStates || writingStates.length === 0)) {
      room.collection("writing_state").upsert({
        id: "main",
        cost_per_word: 0,
        words_remaining: 10,
        last_tip_amount: 0,
        current_color_class: "word-free"
      });
    }
  }, [writingStates, stateLoading]);
  const sortedComments = comments?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || [];
  const sortedWords = leaderboardWords?.sort((a, b) => a.position - b.position) || [];
  const getWordColorClass = (tipAmount) => {
    if (tipAmount === 0) return "word-free";
    if (tipAmount >= 100) return "word-golden";
    if (tipAmount >= 50) return "word-silver";
    return "word-bronze";
  };
  const canAddWord = () => {
    if (!writingState) return false;
    if (writingState.words_remaining > 0) return true;
    return false;
  };
  const getCurrentCost = () => {
    return writingState?.cost_per_word || 0;
  };
  const handleAddWord = async () => {
    if (!currentWord.trim() || !canAddWord() || !currentUser) return;
    const wordCount = sortedWords.length;
    const colorClass = writingState?.current_color_class || "word-free";
    await room.collection("leaderboard_word").upsert({
      word: currentWord.trim(),
      position: wordCount,
      author_id: currentUser.id,
      author_username: currentUser.username,
      cost_paid: writingState?.cost_per_word || 0,
      color_class: colorClass,
      tip_amount: writingState?.last_tip_amount || 0
    });
    await room.collection("writing_state").upsert({
      id: "main",
      cost_per_word: writingState?.cost_per_word || 0,
      words_remaining: (writingState?.words_remaining || 1) - 1,
      last_tip_amount: writingState?.last_tip_amount || 0,
      current_color_class: writingState?.current_color_class || "word-free"
    });
    setCurrentWord("");
  };
  const handleComment = async (tipAmount = 0) => {
    const commentText = tipAmount > 0 ? `Setting next 10 words to ${tipAmount} credits each! \u{1F4B0}` : "Next 10 words are FREE! \u{1F389}";
    try {
      await window.websim.postComment({
        content: commentText,
        credits: tipAmount
      });
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };
  useEffect(() => {
    const handleNewComment = async (data) => {
      const comment = data.comment;
      const tipAmount = comment.card_data?.credits_spent || 0;
      await room.collection("comment").upsert({
        id: comment.id,
        content: comment.raw_content,
        author_id: comment.author.id,
        author_username: comment.author.username,
        tip_amount: tipAmount,
        created_at: comment.created_at
      });
      const newColorClass = getWordColorClass(tipAmount);
      await room.collection("writing_state").upsert({
        id: "main",
        cost_per_word: tipAmount,
        words_remaining: 10,
        last_tip_amount: tipAmount,
        current_color_class: newColorClass
      });
    };
    window.websim.addEventListener("comment:created", handleNewComment);
    return () => {
    };
  }, []);
  if (commentsLoading || wordsLoading || stateLoading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxDEV("div", { className: "text-white text-xl", children: "Loading collaborative leaderboard..." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 139,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 138,
      columnNumber: 13
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen p-6", children: /* @__PURE__ */ jsxDEV("div", { className: "max-w-6xl mx-auto", children: [
    /* @__PURE__ */ jsxDEV("h1", { className: "text-4xl font-bold text-white text-center mb-8", children: "Tipped Words Leaderboard" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 147,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "grid lg:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsxDEV("div", { className: "leaderboard-container p-8", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-bold mb-6", children: "Collaborative Story" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 155,
          columnNumber: 29
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "mb-6 p-4 status-indicator", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-4", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "font-semibold", children: "Words Remaining:" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 159,
              columnNumber: 37
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-xl font-bold text-blue-600", children: writingState?.words_remaining || 0 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 160,
              columnNumber: 37
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 158,
            columnNumber: 33
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "font-semibold", children: "Cost per Word:" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 165,
              columnNumber: 37
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-xl font-bold", children: getCurrentCost() === 0 ? "FREE" : `${getCurrentCost()} credits` }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 166,
              columnNumber: 37
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 164,
            columnNumber: 33
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 157,
          columnNumber: 29
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-50 p-6 rounded-lg mb-6 min-h-[200px]", children: /* @__PURE__ */ jsxDEV("div", { className: "text-lg leading-relaxed", children: sortedWords.map((word, index) => /* @__PURE__ */ jsxDEV(
          "span",
          {
            className: `${word.color_class} mr-2 inline-block`,
            title: `By ${word.author_username} (${word.cost_paid} credits)`,
            children: word.word
          },
          word.id,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 175,
            columnNumber: 41
          },
          this
        )) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 173,
          columnNumber: 33
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 172,
          columnNumber: 29
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              value: currentWord,
              onChange: (e) => setCurrentWord(e.target.value),
              placeholder: "Type your word...",
              className: "flex-1 px-4 py-3 word-input",
              onKeyPress: (e) => e.key === "Enter" && handleAddWord(),
              disabled: !canAddWord()
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 187,
              columnNumber: 33
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleAddWord,
              disabled: !canAddWord() || !currentWord.trim(),
              className: "px-6 py-3 text-white add-word-btn",
              children: "Add Word"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 196,
              columnNumber: 33
            },
            this
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 186,
          columnNumber: 29
        }, this),
        !canAddWord() && /* @__PURE__ */ jsxDEV("p", { className: "text-red-600 mt-2 text-center", children: "No words remaining! Someone needs to comment to unlock more words." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 206,
          columnNumber: 33
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 154,
        columnNumber: 25
      }, this) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 153,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "comment-card p-6", children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-xl font-bold mb-4", children: "Set Word Pricing" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 216,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => handleComment(0),
                className: "w-full px-4 py-3 comment-btn text-white",
                children: "Make Next 10 Words FREE"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 218,
                columnNumber: 33
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => handleComment(25),
                className: "w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors",
                children: "25 Credits per Word"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 224,
                columnNumber: 33
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => handleComment(50),
                className: "w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors",
                children: "50 Credits per Word"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 230,
                columnNumber: 33
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => handleComment(100),
                className: "w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors",
                children: "100 Credits per Word (Golden!)"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 236,
                columnNumber: 33
              },
              this
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 217,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 215,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "comment-card p-6", children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-xl font-bold mb-4", children: "Recent Comments" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 246,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-4 max-h-96 overflow-y-auto", children: sortedComments.map((comment) => /* @__PURE__ */ jsxDEV("div", { className: "border-b pb-3 last:border-b-0", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 mb-2", children: [
              /* @__PURE__ */ jsxDEV(
                "img",
                {
                  src: `https://images.websim.com/avatar/${comment.author_username}`,
                  alt: comment.author_username,
                  className: "w-6 h-6 rounded-full"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 251,
                  columnNumber: 45
                },
                this
              ),
              /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-sm", children: comment.author_username }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 256,
                columnNumber: 45
              }, this),
              comment.tip_amount > 0 && /* @__PURE__ */ jsxDEV("span", { className: "tip-badge px-2 py-1 text-xs", children: [
                comment.tip_amount,
                " credits"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 258,
                columnNumber: 49
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 250,
              columnNumber: 41
            }, this),
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: "text-sm text-gray-700",
                dangerouslySetInnerHTML: {
                  __html: DOMPurify.sanitize(marked.parse(comment.content))
                }
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 263,
                columnNumber: 41
              },
              this
            )
          ] }, comment.id, true, {
            fileName: "<stdin>",
            lineNumber: 249,
            columnNumber: 37
          }, this)) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 247,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 245,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 214,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 151,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 146,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 145,
    columnNumber: 9
  }, this);
}
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 281,
  columnNumber: 13
}));
