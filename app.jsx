import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { WebsimSocket, useQuery } from "@websim/use-query";
import { marked } from "marked";
import DOMPurify from "dompurify";
const room = new WebsimSocket();
function App() {
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
      if (writingState && writingState.words_remaining > 0) {
        const words = comment.raw_content.split(/\s+/).filter(
          (word) => word.trim() !== "" && !word.includes("\u{1F4B0}") && !word.includes("\u{1F389}") && !/^\d+$/.test(word) && // exclude pure numbers
          word.length > 1
          // exclude single characters
        );
        const wordsToAdd = words.slice(0, writingState.words_remaining);
        const currentWordCount = sortedWords.length;
        for (let i = 0; i < wordsToAdd.length; i++) {
          await room.collection("leaderboard_word").upsert({
            word: wordsToAdd[i],
            position: currentWordCount + i,
            author_id: comment.author.id,
            author_username: comment.author.username,
            cost_paid: writingState.cost_per_word,
            color_class: writingState.current_color_class,
            tip_amount: writingState.last_tip_amount
          });
        }
        const remainingWords = Math.max(0, writingState.words_remaining - wordsToAdd.length);
        await room.collection("writing_state").upsert({
          id: "main",
          cost_per_word: writingState.cost_per_word,
          words_remaining: remainingWords,
          last_tip_amount: writingState.last_tip_amount,
          current_color_class: writingState.current_color_class
        });
      }
    };
    window.websim.addEventListener("comment:created", handleNewComment);
    return () => {
    };
  }, [writingState, sortedWords]);
  if (commentsLoading || wordsLoading || stateLoading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxDEV("div", { className: "text-white text-xl", children: "Loading collaborative leaderboard..." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 145,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 144,
      columnNumber: 13
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen p-4 md:p-6", children: /* @__PURE__ */ jsxDEV("div", { className: "max-w-6xl mx-auto", children: [
    /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl md:text-4xl font-bold text-white text-center mb-6 md:mb-8", children: "Tipped Words Leaderboard" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 153,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col lg:flex-row gap-6 lg:gap-8", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "w-full lg:w-2/3", children: /* @__PURE__ */ jsxDEV("div", { className: "leaderboard-container p-4 md:p-8", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-xl md:text-2xl font-bold mb-4 md:mb-6", children: "Collaborative Story" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 161,
          columnNumber: 29
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "mb-4 md:mb-6 p-3 md:p-4 status-indicator", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-2 md:mb-4", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-sm md:text-base", children: "Words Remaining:" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 165,
              columnNumber: 37
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-lg md:text-xl font-bold text-blue-600", children: writingState?.words_remaining || 0 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 166,
              columnNumber: 37
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 164,
            columnNumber: 33
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-sm md:text-base", children: "Cost per Word:" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 171,
              columnNumber: 37
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-lg md:text-xl font-bold", children: getCurrentCost() === 0 ? "FREE" : `${getCurrentCost()} credits` }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 172,
              columnNumber: 37
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 170,
            columnNumber: 33
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 163,
          columnNumber: 29
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-50 p-4 md:p-6 rounded-lg mb-4 md:mb-6 min-h-[150px] md:min-h-[200px]", children: /* @__PURE__ */ jsxDEV("div", { className: "text-base md:text-lg leading-relaxed", children: sortedWords.map((word, index) => /* @__PURE__ */ jsxDEV(
          "span",
          {
            className: `${word.color_class} mr-2 inline-block mb-1`,
            title: `By ${word.author_username} (${word.cost_paid} credits)`,
            children: word.word
          },
          word.id,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 181,
            columnNumber: 41
          },
          this
        )) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 179,
          columnNumber: 33
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 178,
          columnNumber: 29
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500", children: /* @__PURE__ */ jsxDEV("p", { className: "text-blue-800 text-sm md:text-base", children: [
          /* @__PURE__ */ jsxDEV("strong", { children: "How it works:" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 194,
            columnNumber: 37
          }, this),
          " Words are automatically extracted from comments! Comment with text to add words to the story. Use the buttons below to set pricing for the next 10 words."
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 193,
          columnNumber: 33
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 192,
          columnNumber: 29
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 160,
        columnNumber: 25
      }, this) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 159,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "w-full lg:w-1/3 space-y-4 md:space-y-6", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "comment-card p-4 md:p-6", children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-lg md:text-xl font-bold mb-3 md:mb-4", children: "Set Word Pricing" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 204,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => handleComment(0),
                className: "w-full px-3 md:px-4 py-2 md:py-3 comment-btn text-white text-sm md:text-base",
                children: "Make Next 10 Words FREE"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 206,
                columnNumber: 33
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => handleComment(25),
                className: "w-full px-3 md:px-4 py-2 md:py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors text-sm md:text-base",
                children: "25 Credits per Word"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 212,
                columnNumber: 33
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => handleComment(50),
                className: "w-full px-3 md:px-4 py-2 md:py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors text-sm md:text-base",
                children: "50 Credits per Word"
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
                onClick: () => handleComment(100),
                className: "w-full px-3 md:px-4 py-2 md:py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors text-sm md:text-base",
                children: "100 Credits per Word (Golden!)"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 224,
                columnNumber: 33
              },
              this
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 205,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 203,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "comment-card p-4 md:p-6", children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-lg md:text-xl font-bold mb-3 md:mb-4", children: "Recent Comments" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 234,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 md:space-y-4 max-h-64 md:max-h-96 overflow-y-auto", children: sortedComments.map((comment) => /* @__PURE__ */ jsxDEV("div", { className: "border-b pb-2 md:pb-3 last:border-b-0", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 mb-1 md:mb-2", children: [
              /* @__PURE__ */ jsxDEV(
                "img",
                {
                  src: `https://images.websim.com/avatar/${comment.author_username}`,
                  alt: comment.author_username,
                  className: "w-5 h-5 md:w-6 md:h-6 rounded-full"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 239,
                  columnNumber: 45
                },
                this
              ),
              /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-xs md:text-sm", children: comment.author_username }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 244,
                columnNumber: 45
              }, this),
              comment.tip_amount > 0 && /* @__PURE__ */ jsxDEV("span", { className: "tip-badge px-1 md:px-2 py-1 text-xs", children: [
                comment.tip_amount,
                " credits"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 246,
                columnNumber: 49
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 238,
              columnNumber: 41
            }, this),
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: "text-xs md:text-sm text-gray-700",
                dangerouslySetInnerHTML: {
                  __html: DOMPurify.sanitize(marked.parse(comment.content))
                }
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 251,
                columnNumber: 41
              },
              this
            )
          ] }, comment.id, true, {
            fileName: "<stdin>",
            lineNumber: 237,
            columnNumber: 37
          }, this)) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 235,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 233,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 202,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 157,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 152,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 151,
    columnNumber: 9
  }, this);
}
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 269,
  columnNumber: 13
}));
