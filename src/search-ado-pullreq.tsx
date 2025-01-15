import { Action, ActionPanel, List, Icon, Color } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { preparedPersonalAccessToken, baseApiUrl } from "./preferences";
import { AdoPrResponse, PullRequest } from "./types";

const getPullRequestIcon = (pullreq: PullRequest) => {
  if (pullreq.isDraft) {
    return { source: Icon.Pencil, tintColor: Color.Red };
  }

  if(pullreq.reviewers.some((reviweer) => reviweer.vote === 10)) {
    return { source: Icon.Check, tintColor: Color.Green };
  }
    
  return { source: "pull-request-open-unread.svg", tintColor: Color.Purple }; 
  
};

export default () => {
  const { data, isLoading } = useFetch<AdoPrResponse>(
    `${baseApiUrl()}/_apis/git/pullrequests?api-version=6.0`,
    {
      headers: { Accept: "application/json", Authorization: `Basic ${preparedPersonalAccessToken()}` },
    },
  );

  return (
    <List isLoading={isLoading}>
      {data?.value
        .map((pullreq) => (
          <List.Item
            icon={getPullRequestIcon(pullreq)}
            key={pullreq.pullRequestId}
            title={`${pullreq.pullRequestId} - ${pullreq.title}`}
            subtitle={pullreq.repository.name}
            accessories={[
              {
                tag: pullreq.createdBy.displayName,
                icon: { source: Icon.Person }
              },
            ]}
            keywords={[ pullreq.createdBy.displayName.split(" ")[0], pullreq.createdBy.displayName.split(" ")[1], pullreq.repository.name ]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="Open in Browser" url={`${baseApiUrl()}/${pullreq.repository.project.name}/_git/${pullreq.repository.name}/pullrequest/${pullreq.pullRequestId}`} />
              </ActionPanel>
            }
          />
        ))}
    </List>
  );
};
