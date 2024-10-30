describe("Hacker News", () => {
  const initialTerm = "redux";
  const newTerm = "Cypress";

  context("Hitting the real API", () => {
    beforeEach(() => {
      cy.intercept({
        method: "GET",
        pathname: "**/search",
        query: {
          query: initialTerm,
          page: "0",
        },
      }).as("getStories");
      cy.visit("/");
      cy.wait("@getStories");
    });

    it('shows 100 stories, then the next 100 after clicking "More"', () => {
      cy.intercept({
        method: "GET",
        pathname: "**/search",
        query: {
          query: initialTerm,
          page: "1",
        },
      }).as("getNextStories");
      cy.get(".table-row").should("have.length", 100);
      cy.contains("More").should("be.visible").click();
      cy.assertLoadingIsShownAndHidden();
      cy.get(".table-row").should("have.length", 200);
    });

    // it("searches via the last searched term", () => {
    //   //aplicação não possui botões com últimas pesquisas
    // });
  });

  context("Moking the API", () => {
    context("Footer and list of stories", () => {
      beforeEach(() => {
        cy.intercept(
          {
            method: "GET",
            pathname: "**/search",
            query: {
              query: initialTerm,
              page: "0",
            },
          },
          {
            fixture: "stories",
          }
        ).as("getStories");

        cy.visit("/");
        cy.wait("@getStories");
      });
    //   it("shows the footer", () => {
    //     // aplicação não possui footer
    //   });

      context("List of stories", () => {
        const stories = require("../../fixtures/stories");
        it("shows the right data for all rendered stories", () => {
          cy.get(".table-row")
            .first()
            .should("be.visible")
            .and("contain", stories.hits[0].title)
            .and("contain", stories.hits[0].author)
            .and("contain", stories.hits[0].num_comments)
            .and("contain", stories.hits[0].points);

          cy.get(`.table-row a:contains(${stories.hits[0].title})`).should(
            "have.attr",
            "href",
            stories.hits[0].url
          );

          cy.get(".table-row")
            .last()
            .should("be.visible")
            .and("contain", stories.hits[1].title)
            .and("contain", stories.hits[1].author)
            .and("contain", stories.hits[1].num_comments)
            .and("contain", stories.hits[1].points);

          cy.get(`.table-row a:contains(${stories.hits[1].title})`).should(
            "have.attr",
            "href",
            stories.hits[1].url
          );
        });

        it("shows only one less story after dimissing the first one", () => {
          cy.get(".table-row").should("have.length", 2);
          cy.get(".button-inline:contains(Dismiss)")
            .should("be.visible")
            .first()
            .click();
          cy.get(".table-row").should("have.length", 0);
        });

        context("Order by", () => {
          it("orders by title", () => {
            cy.get(".button-inline:contains(Title)")
              .as("titleHeader")
              .should("be.visible")
              .click();

            cy.get(".table-row")
              .first()
              .should("be.visible")
              .and("contain", stories.hits[0].title);
            cy.get(`.table-row a:contains(${stories.hits[0].title})`).should(
              "have.attr",
              "href",
              stories.hits[0].url
            );

            cy.get("@titleHeader").click();

            cy.get(".table-row")
              .first()
              .should("be.visible")
              .and("contain", stories.hits[1].title);
            cy.get(`.table-row a:contains(${stories.hits[1].title})`).should(
              "have.attr",
              "href",
              stories.hits[1].url
            );
          });

          it("orders by author", () => {
            cy.get(".button-inline:contains(Author)")
              .as("authorHeader")
              .should("be.visible")
              .click();

            cy.get(".table-row")
              .first()
              .should("be.visible")
              .and("contain", stories.hits[0].author);

            cy.get("@authorHeader").click();

            cy.get(".table-row")
              .first()
              .should("be.visible")
              .and("contain", stories.hits[1].author);
          });

          it("orders by comments", () => {
            cy.get(".button-inline:contains(Comments)")
              .as("commentsHeader")
              .should("be.visible")
              .click();

            cy.get(".table-row")
              .first()
              .should("be.visible")
              .and("contain", stories.hits[1].num_comments);

            cy.get("@commentsHeader").click();

            cy.get(".table-row")
              .first()
              .should("be.visible")
              .and("contain", stories.hits[0].num_comments);
          });

          it("orders by points", () => {
            cy.get(".button-inline:contains(Points)")
              .as("pointsHeader")
              .should("be.visible")
              .click();

            cy.get(".table-row")
              .first()
              .should("be.visible")
              .and("contain", stories.hits[1].points);

            cy.get("@pointsHeader").click();

            cy.get(".table-row")
              .first()
              .should("be.visible")
              .and("contain", stories.hits[0].points);
          });
        });
      });
    });

    context("Search", () => {
      beforeEach(() => {
        cy.intercept(
            {
              method: "GET",
              pathname: "**/search",
              query: {
                query: initialTerm,
                page: "0",
              },
            },
            {
              fixture: "empty",
            }
          ).as("getEmptyList");

        cy.intercept(
            {
              method: "GET",
              pathname: "**/search",
              query: {
                query: newTerm,
                page: "0",
              },
            },
            {
              fixture: "stories",
            }
          ).as("getStories");

        cy.visit("/");
        cy.wait("@getEmptyList");

        // cy.get("#search").should("be.visible").clear();
        cy.get('input[aria-label="Search term input text field"]').should("be.visible").clear();
      });

      it("shows no story when none is returned", () => {
        cy.get(".table-row").should("not.exist");
      });

      it("types and hits ENTER", () => {
        cy.get('input[aria-label="Search term input text field"]').should("be.visible").type(`${newTerm}{enter}`);

        cy.wait("@getStories");

        // cy.getLocalStorage("search").should("be.equal", newTerm);

        cy.get(".table-row").should("have.length", 2);
        // cy.get(`button:contains(${initialTerm})`).should("be.visible");
        // aplicação não possui botão com termo inicial
      });

      it("types and clicks the submit button", () => {
        cy.get('input[aria-label="Search term input text field"]').should("be.visible").type(newTerm);
        cy.contains("Search").should("be.visible").click();

        cy.wait("@getStories");

        // cy.getLocalStorage("search").should("be.equal", newTerm);

        cy.get(".table-row").should("have.length", 2);
        // cy.get(`button:contains(${initialTerm})`).should("be.visible");
      });

      it("types and submits the forms directly", () => {
        cy.get('input[aria-label="Search term input text field"]').type(newTerm);
        cy.get("form").submit();
        cy.wait("@getStories");
        cy.get(".table-row").should("have.length", 2);
      });

      context("Last searches", () => {
        // it("shows a max of 5 buttons for the last searched terms", () => {
        //   // teste não realizado
        // });
      });
    });
  });

  context("Errors", () => {
    it('shows "Something went wrong." in case of a server error', () => {
      cy.intercept("GET", "**/search**", { statusCode: 500 }).as(
        "getServerFailure"
      );
      cy.visit("/");
      cy.wait("@getServerFailure");
      cy.get("p:contains(Something went wrong.)").should("be.visible");
    });

    it('shows "Something went wrong." in case of a network error', () => {
      cy.intercept("GET", "**/search**", { forceNetworkError: true }).as(
        "getNetworkFailure"
      );
      cy.visit("/");
      cy.wait("@getNetworkFailure");
      cy.get("p:contains(Something went wrong.)").should("be.visible");
    });
  });
});

it('shows a "Loading ..." state before showing the results', () => {
  cy.intercept("GET", "**/search**", {
    delay: 1000,
    fixture: "stories",
  }).as("getDelayedStories");

  cy.visit("/");

  cy.assertLoadingIsShownAndHidden();
  cy.wait("@getDelayedStories");

  cy.get(".table-row").should("have.length", 2);
});
