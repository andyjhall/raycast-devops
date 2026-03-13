import { Action, ActionPanel, List, Icon, Color } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { preparedPersonalAccessToken, baseApiUrl } from "./preferences";
import { AdoPrResponse, PullRequest } from "./types";
import { useState } from "react";

const getPullRequestIcon = (pullreq: PullRequest) => {
  if (pullreq.isDraft) {
    return { source: Icon.Pencil, tintColor: Color.Red };
  }

  // approved
  if (pullreq.reviewers.some((reviewer) => reviewer.vote === 10)) {
    return { source: Icon.Check, tintColor: Color.Green };
  }

  // approved with suggestions
  if (pullreq.reviewers.some((reviewer) => reviewer.vote === 5)) {
    return { source: Icon.Check, tintColor: Color.Orange };
  }

  // 0 = unapproved
  return { source: "pull-request-open-unread.svg", tintColor: Color.Purple };
};

const getPullRequestUrl = (pullreq: PullRequest) =>
  `${baseApiUrl()}/${pullreq.repository.project.name}/_git/${pullreq.repository.name}/pullrequest/${pullreq.pullRequestId}`;

export default () => {
  const { data, isLoading } = useFetch<AdoPrResponse>(`${baseApiUrl()}/_apis/git/pullrequests?api-version=6.0`, {
    headers: { Accept: "application/json", Authorization: `Basic ${preparedPersonalAccessToken()}` },
  });

  const [query, setQuery] = useState("");

  // Extract search type and term
  const searchMatch = query.match(/^!(id|title|repo|user)\s+(.+)/i);
  const searchType = searchMatch?.[1]?.toLowerCase();
  const searchTerm = searchMatch?.[2]?.toLowerCase() ?? query;

  const filteredPRs = data?.value.filter((pullreq) => {
    switch (searchType) {
      case "id":
        return pullreq.pullRequestId.toString().includes(searchTerm);
      case "title":
        return pullreq.title.toLowerCase().includes(searchTerm);
      case "repo":
        return pullreq.repository.name.toLowerCase().includes(searchTerm);
      case "user":
        return pullreq.createdBy.displayName.toLowerCase().includes(searchTerm);
      default:
        return (
          pullreq.pullRequestId.toString().includes(searchTerm) ||
          pullreq.title.toLowerCase().includes(searchTerm) ||
          pullreq.repository.name.toLowerCase().includes(searchTerm) ||
          pullreq.createdBy.displayName.toLowerCase().includes(searchTerm)
        );
    }
  });

  return (
    <List isLoading={isLoading} onSearchTextChange={setQuery}>
      {filteredPRs?.map((pullreq) => (
        <List.Item
          icon={getPullRequestIcon(pullreq)}
          key={pullreq.pullRequestId}
          title={`${pullreq.pullRequestId} - ${pullreq.title}`}
          subtitle={pullreq.repository.name}
          accessories={[
            {
              tag: pullreq.createdBy.displayName,
              icon: { source: Icon.Person },
            },
          ]}
          keywords={[
            pullreq.createdBy.displayName.split(" ")[0],
            pullreq.createdBy.displayName.split(" ")[1],
            pullreq.repository.name,
          ]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Open in Browser" url={getPullRequestUrl(pullreq)} />
              <Action.CopyToClipboard
                title="Copy Pull Request URL"
                content={getPullRequestUrl(pullreq)}
                icon={Icon.CopyClipboard}
                shortcut={{ modifiers: ["cmd"], key: "." }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
};
